const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const supabase = require('./supabase');
require('dotenv').config();

const axios = require('axios');

if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    passport.use(new GoogleStrategy({
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: "/api/auth/google/callback",
        proxy: true // Important for Render/Heroku to detect HTTPS
    },
        async function (accessToken, refreshToken, profile, cb) {
            try {
                // --- AGE VERIFICATION START ---
                try {
                    const peopleRes = await axios.get('https://people.googleapis.com/v1/people/me?personFields=birthdays', {
                        headers: { Authorization: `Bearer ${accessToken}` }
                    });
                    const birthdays = peopleRes.data.birthdays;
                    if (birthdays && birthdays.length > 0) {
                        const birthday = birthdays[0].date;
                        if (birthday && birthday.year) {
                            const today = new Date();
                            const birthDate = new Date(birthday.year, (birthday.month || 1) - 1, birthday.day || 1);
                            let age = today.getFullYear() - birthDate.getFullYear();
                            const m = today.getMonth() - birthDate.getMonth();
                            if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
                                age--;
                            }

                            if (age < 18) {
                                console.log(`[AUTH-BLOCK] User ${profile.emails[0].value} is under 18 (${age}).`);
                                return cb(null, false, { message: 'You must be at least 18 years old to sign up.' });
                            }
                        }
                    }
                } catch (ageErr) {
                    // console.warn("Age Check Service Skipped (API not enabled)"); 
                    // Proceeding without age verification (Fallback)
                }
                // --- AGE VERIFICATION END ---

                const email = profile.emails && profile.emails[0] ? profile.emails[0].value : null;
                const googleId = profile.id;
                const avatar = profile.photos && profile.photos[0] ? profile.photos[0].value : null;
                const name = profile.displayName;

                // 1. Try to find user by google_id
                let { data: user, error } = await supabase
                    .from('users')
                    .select('*')
                    .eq('google_id', googleId)
                    .single();

                // 2. If not found by ID, try by Email (merge account)
                if (!user && email) {
                    const { data: emailUser } = await supabase
                        .from('users')
                        .select('*')
                        .eq('email', email)
                        .single();

                    if (emailUser) {
                        user = emailUser;
                        // Link Google ID to existing user
                        await supabase.from('users').update({
                            google_id: googleId,
                            avatar: avatar || emailUser.avatar, // Update avatar if missing
                            name: name || emailUser.name
                        }).eq('id', user.id);
                    }
                }

                // 3. If still no user, Create New
                if (!user) {
                    // Get IP from request? Passport doesn't give req easily here without passReqToCallback
                    // We'll leave IP/Geo as null or update them on next 'check-in'

                    const { data: newUser, error: createError } = await supabase
                        .from('users')
                        .insert({
                            google_id: googleId,
                            email: email,
                            name: name,
                            avatar: avatar,
                            status: 'active',
                            created_at: new Date(),
                            last_login_at: new Date()
                        })
                        .select()
                        .single();

                    if (createError) throw createError;
                    user = newUser;
                } else {
                    // Update Last Login
                    await supabase.from('users').update({ last_login_at: new Date() }).eq('id', user.id);
                }

                return cb(null, user);
            } catch (err) {
                console.error("Google Auth Error:", err);
                return cb(err, null);
            }
        }
    ));
} else {
    console.warn("⚠️  GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET missing. Google Auth disabled.");
}

// Serialize/Deserialize not strictly needed for JWT stateless but required by passport session if used
passport.serializeUser((user, done) => {
    done(null, user);
});

passport.deserializeUser((user, done) => {
    done(null, user);
});

module.exports = passport;
