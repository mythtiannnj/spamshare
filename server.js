const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const cors = require('cors');
const path = require('path');
const fs = require('fs').promises;
const crypto = require('crypto');
const { randomInt } = require('crypto');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Configuration
const CONFIG = {
    output_dir: path.join(__dirname, 'output'),
    facebook_reg_url: 'https://x.facebook.com/reg',
    facebook_submit_url: 'https://www.facebook.com/reg/submit/',
    temp_mail_api: 'https://api.internal.temp-mail.io/api/v3/email',
    proxy_api: 'https://api.proxyscrape.com/v2/?request=displayproxies&protocol=socks4&timeout=100000&country=all&ssl=all&anonymity=all'
};

// Ensure output directory exists
fs.mkdir(CONFIG.output_dir, { recursive: true });

// Name databases
const firstNames = [
    "Maria", "Ana", "Joy", "Grace", "Angel", "Angela", "Christine", "Kristine",
    "Michelle", "Shiela", "Sheila", "Maricel", "Marites", "Maribel", "Marjorie",
    "Jennifer", "Jenny", "Jessa", "Jessica", "Janine", "Katherine", "Catherine",
    "Kathleen", "Karen", "Karla", "Camille", "Bianca", "Patricia", "Patty",
    "Tricia", "Aileen", "Eileen", "Irene", "Iris", "Hazel", "Cherry", "Lovely",
    "Honey", "Princess", "Angelica", "Bernadette", "Rowena", "Rosalie", "Roselyn",
    "Rosalinda", "Lourdes", "Teresa", "Therese", "Carmela", "Carmen", "Liza",
    "Elizabeth", "Beth", "Isabel", "Isabela", "Bella", "Andrea", "Andi",
    "Alexandra", "Alexa", "Nina", "Mina", "Rina", "Jocelyn", "Jocelle", "Jhoanna",
    "Joan", "Joanne", "Joanna", "Johanna", "May", "Mae", "Mylene", "Myra", "Myrna",
    "Melanie", "Melisa", "Melissa", "Marissa", "Mariz", "Pauline", "Paula",
    "Paulina", "Regina", "Rhea", "Rochelle", "Sharon", "Samantha", "Sandra",
    "Sarah", "Sophia", "Sofia", "Stephanie", "Tiffany", "Vanessa", "Veronica",
    "Vina", "Yvonne", "Leah", "Lia", "Louise", "Luisa", "Lorraine", "Lorna",
    "Lani", "Mika", "Mikaela", "Janelle", "Janella", "Janice", "Joyce", "Judy",
    "Judith", "Julie", "Juliana", "Juliet", "Julienne", "Faith", "Hope",
    "Charity", "Heaven", "Blessy", "Precious", "Lovelyn", "Shaira", "Aira",
    "Kyra", "Rachelle", "Rachel", "Reina", "Selena", "Selina", "Trisha", "Trina",
    "Wendy", "Zenaida", "Juan", "Jose", "Pedro", "Paolo", "Paul", "Mark", "John",
    "Johnny", "Jonathan", "Nathan", "Michael", "Miguel", "Daniel", "David",
    "Andrew", "Andre", "Anthony", "Antonio", "Albert", "Alfred", "Brian", "Bryan",
    "Benjamin", "Carlo", "Carlos", "Christian", "Christopher", "Chris", "Cedric",
    "Cesar", "Dennis", "Diego", "Dominic", "Edward", "Edgar", "Emmanuel", "Eric",
    "Erwin", "Francis", "Frank", "Gabriel", "Gilbert", "Henry", "Ian", "Ivan",
    "James", "Jasper", "Jerome", "Joel", "Joshua", "Kenneth", "Kevin", "Kyle",
    "Lawrence", "Leo", "Leonard", "Lester", "Louis", "Lucas", "Marco", "Martin",
    "Matthew", "Melvin", "Nathaniel", "Noel", "Oliver", "Patrick", "Paolo",
    "Raymond", "Richard", "Robert", "Ronald", "Ryan", "Samuel", "Sebastian",
    "Steven", "Stephen", "Thomas", "Timothy", "Victor", "Vincent", "Wilfred",
    "William", "Xavier", "Zachary"
];

const surnames = [
    "Santos", "Reyes", "Cruz", "Bautista", "Garcia", "Mendoza", "Flores",
    "Gonzales", "Ramos", "Aquino", "DelaCruz", "DelosSantos", "Villanueva",
    "Fernandez", "Castillo", "Torres", "Dominguez", "Navarro", "Salazar",
    "DeGuzman", "Perez", "Rivera", "Lopez", "Martinez", "Hernandez", "Alvarez",
    "Morales", "Rojas", "Santiago", "Padilla", "Rosales", "Valdez", "Estrada",
    "Aguilar", "Manalo", "Francisco", "Romero", "Velasco", "Soriano", "Pascual",
    "Pineda", "Ferrer", "Cuevas", "Suarez", "Montes", "Calderon", "DelosReyes",
    "Lim", "Tan", "Chua"
];

// Phone prefixes by country
const phoneConfigs = {
    BD: { code: '+88', prefixes: ['017', '018', '019', '016', '015', '013', '014'], length: 8 },
    KH: { code: '+855', prefixes: ['010', '011', '012', '013', '014', '015', '016', '017', '092', '093', '097', '098', '099'], length: 6 },
    NP: { code: '+977', prefixes: ['97', '98'], length: 8 },
    IN: { code: '+91', prefixes: ['98', '99', '97', '96', '95', '94'], length: 8 },
    PK: { code: '+92', prefixes: ['300', '301', '302', '303', '304', '305'], length: 7 },
    UK: { code: '+44', prefixes: ['7400', '7500', '7600', '7700', '7800', '7900'], length: 6 },
    PH: { code: '+63', prefixes: ['917', '918', '919', '920', '921', '922'], length: 7 },
    ID: { code: '+62', prefixes: ['813', '815', '816', '817', '818', '819'], length: 7 },
    OM: { code: '+968', prefixes: ['71', '72', '73', '79'], length: 6 },
    US: { code: '+1', prefixes: ['201', '202', '303', '312', '415', '646', '718'], length: 7 },
    NG: { code: '+234', prefixes: ['701', '703', '704', '705', '706', '707', '708', '802', '803'], length: 7 },
    ZA: { code: '+27', prefixes: ['60', '61', '62', '63', '71', '72', '73'], length: 7 }
};

// User-Agent generator
function generateUserAgent() {
    const androidVersions = ['10', '11', '12', '13'];
    const chromeVersions = ['100', '101', '102', '103', '104', '105', '106', '107', '108', '109', '110', '111', '112', '113', '114'];
    
    const androidVer = androidVersions[Math.floor(Math.random() * androidVersions.length)];
    const chromeVer = chromeVersions[Math.floor(Math.random() * chromeVersions.length)];
    const buildVer = Math.floor(Math.random() * 9000) + 1000;
    const patchVer = Math.floor(Math.random() * 150) + 70;
    
    const devices = ['SM-G998B', 'Pixel 6', 'OnePlus 9 Pro', 'Xiaomi Mi 11', 'OPPO Find X3', 'Realme GT'];
    const device = devices[Math.floor(Math.random() * devices.length)];
    
    return `Mozilla/5.0 (Linux; Android ${androidVer}; ${device}) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${chromeVer}.0.${buildVer}.${patchVer} Mobile Safari/537.36`;
}

// Generate random password
function generatePassword() {
    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const lowercase = 'abcdefghijklmnopqrstuvwxyz';
    const numbers = '0123456789';
    const symbols = '!@#$%^&*()_+';
    
    let password = '';
    password += uppercase[Math.floor(Math.random() * uppercase.length)];
    password += lowercase[Math.floor(Math.random() * lowercase.length)];
    password += numbers[Math.floor(Math.random() * numbers.length)];
    password += symbols[Math.floor(Math.random() * symbols.length)];
    
    const allChars = uppercase + lowercase + numbers + symbols;
    for (let i = password.length; i < 12; i++) {
        password += allChars[Math.floor(Math.random() * allChars.length)];
    }
    
    return password.split('').sort(() => Math.random() - 0.5).join('');
}

// Generate phone number
function generatePhoneNumber() {
    const countries = Object.keys(phoneConfigs);
    const country = countries[Math.floor(Math.random() * countries.length)];
    const config = phoneConfigs[country];
    const prefix = config.prefixes[Math.floor(Math.random() * config.prefixes.length)];
    
    let number = '';
    for (let i = 0; i < config.length; i++) {
        number += Math.floor(Math.random() * 10);
    }
    
    return `${config.code}${prefix}${number}`;
}

// Generate BD phone number
function generateBDPhone() {
    const prefixes = ['017', '018', '019', '016', '015', '013', '014'];
    const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
    let number = '';
    for (let i = 0; i < 8; i++) {
        number += Math.floor(Math.random() * 10);
    }
    return `+88${prefix}${number}`;
}

// Generate temp email
function generateTempEmail() {
    const domains = ['@tempmail.com', '@temp-mail.org', '@guerrillamail.com', '@10minutemail.com'];
    const username = crypto.randomBytes(8).toString('hex');
    return username + domains[Math.floor(Math.random() * domains.length)];
}

// Extract form data from HTML
function extractFormData(html) {
    const $ = cheerio.load(html);
    const formData = {};
    
    $('input').each((i, elem) => {
        const name = $(elem).attr('name');
        const value = $(elem).attr('value') || '';
        if (name) {
            formData[name] = value;
        }
    });
    
    return formData;
}

// Check Facebook profile picture
async function checkProfilePicture(uid) {
    try {
        const url = `https://graph.facebook.com/${uid}/picture?type=normal`;
        const response = await axios.get(url, {
            maxRedirects: 0,
            validateStatus: (status) => status === 302,
            headers: { 'User-Agent': generateUserAgent() }
        });
        
        if (response.status === 302) {
            const redirectUrl = response.headers.location || '';
            return redirectUrl.includes('scontent');
        }
        return false;
    } catch (error) {
        return false;
    }
}

// Create Facebook account
async function createFacebookAccount(emailType, password, customPassword = null) {
    const session = axios.create({
        headers: {
            'User-Agent': generateUserAgent(),
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.9',
            'Accept-Encoding': 'gzip, deflate, br',
            'Connection': 'keep-alive'
        }
    });
    
    try {
        // Get registration page
        const regResponse = await session.get(CONFIG.facebook_reg_url);
        const formData = extractFormData(regResponse.data);
        
        // Generate user data
        const { first, last } = getRandomName();
        const finalPassword = customPassword || generatePassword();
        
        // Generate email/phone based on type
        let contact;
        switch(emailType) {
            case 'bd':
                contact = generateBDPhone();
                break;
            case 'mixed':
                contact = generatePhoneNumber();
                break;
            case 'temp':
                contact = generateTempEmail();
                break;
            default:
                contact = generateBDPhone();
        }
        
        // Prepare payload
        const payload = {
            ccp: "2",
            reg_instance: formData.reg_instance || "",
            submission_request: "true",
            reg_impression_id: formData.reg_impression_id || "",
            ns: "1",
            logger_id: formData.logger_id || "",
            firstname: first,
            lastname: last,
            birthday_day: String(Math.floor(Math.random() * 20) + 10),
            birthday_month: String(Math.floor(Math.random() * 12) + 1),
            birthday_year: String(Math.floor(Math.random() * 15) + 1985),
            reg_email__: contact,
            sex: "1",
            encpass: `#PWD_BROWSER:0:${Math.floor(Date.now() / 1000)}:${finalPassword}`,
            submit: "Sign Up",
            fb_dtsg: formData.fb_dtsg || "",
            jazoest: formData.jazoest || "",
            lsd: formData.lsd || ""
        };
        
        // Submit registration
        const submitResponse = await session.post(CONFIG.facebook_submit_url, 
            new URLSearchParams(payload).toString(),
            {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Referer': 'https://www.facebook.com/reg/'
                }
            }
        );
        
        // Get cookies
        const cookies = session.defaults.headers.common['Cookie'] || '';
        const cookieObj = {};
        if (cookies) {
            cookies.split(';').forEach(cookie => {
                const [key, value] = cookie.trim().split('=');
                if (key && value) cookieObj[key] = value;
            });
        }
        
        const uid = cookieObj.c_user;
        
        if (uid) {
            const hasProfilePic = await checkProfilePicture(uid);
            
            const result = {
                success: true,
                uid: uid,
                password: finalPassword,
                email: contact,
                name: `${first} ${last}`,
                gender: 'Female',
                dob: `${payload.birthday_day}-${payload.birthday_month}-${payload.birthday_year}`,
                hasProfilePic: hasProfilePic,
                cookies: cookies
            };
            
            // Save to file
            await saveAccount(result);
            
            return result;
        }
        
        return { success: false, error: 'Registration failed - no UID received' };
        
    } catch (error) {
        return { success: false, error: error.message };
    }
}

// Save account to file
async function saveAccount(account) {
    const filePath = path.join(CONFIG.output_dir, 'created_accounts.txt');
    const line = `${account.uid}|${account.email}|${account.password}|${account.cookies}\n`;
    await fs.appendFile(filePath, line);
}

// Bulk create accounts
async function bulkCreateAccounts(emailType, passwordType, customPassword, count, showDetails, onProgress) {
    const results = {
        success: [],
        failed: [],
        total: count
    };
    
    for (let i = 0; i < count; i++) {
        const password = passwordType === 'custom' ? customPassword : null;
        const result = await createFacebookAccount(emailType, passwordType, password);
        
        if (result.success) {
            results.success.push(result);
        } else {
            results.failed.push(result);
        }
        
        if (onProgress) {
            onProgress({
                current: i + 1,
                total: count,
                success: results.success.length,
                failed: results.failed.length,
                lastResult: result
            });
        }
        
        // Delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    return results;
}

// API Routes
app.post('/api/create-accounts', async (req, res) => {
    const { emailType, passwordType, customPassword, count, showDetails } = req.body;
    
    if (!count || count < 1 || count > 100) {
        return res.status(400).json({ error: 'Count must be between 1 and 100' });
    }
    
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    
    const results = {
        success: [],
        failed: [],
        total: count
    };
    
    for (let i = 0; i < count; i++) {
        try {
            const password = passwordType === 'custom' ? customPassword : null;
            const result = await createFacebookAccount(emailType, passwordType, password);
            
            if (result.success) {
                results.success.push(result);
                res.write(`data: ${JSON.stringify({ type: 'success', data: result, progress: { current: i + 1, total: count, success: results.success.length, failed: results.failed.length } })}\n\n`);
            } else {
                results.failed.push(result);
                res.write(`data: ${JSON.stringify({ type: 'error', data: result, progress: { current: i + 1, total: count, success: results.success.length, failed: results.failed.length } })}\n\n`);
            }
        } catch (error) {
            results.failed.push({ error: error.message });
            res.write(`data: ${JSON.stringify({ type: 'error', data: { error: error.message }, progress: { current: i + 1, total: count, success: results.success.length, failed: results.failed.length } })}\n\n`);
        }
        
        await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    res.write(`data: ${JSON.stringify({ type: 'complete', results })}\n\n`);
    res.end();
});

app.get('/api/accounts', async (req, res) => {
    try {
        const filePath = path.join(CONFIG.output_dir, 'created_accounts.txt');
        const content = await fs.readFile(filePath, 'utf-8');
        const accounts = content.split('\n')
            .filter(line => line.trim())
            .map(line => {
                const [uid, email, password, cookies] = line.split('|');
                return { uid, email, password, cookies };
            });
        res.json(accounts);
    } catch (error) {
        res.json([]);
    }
});

app.delete('/api/accounts', async (req, res) => {
    try {
        const filePath = path.join(CONFIG.output_dir, 'created_accounts.txt');
        await fs.writeFile(filePath, '');
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/stats', async (req, res) => {
    try {
        const filePath = path.join(CONFIG.output_dir, 'created_accounts.txt');
        const content = await fs.readFile(filePath, 'utf-8');
        const accounts = content.split('\n').filter(line => line.trim());
        res.json({ totalAccounts: accounts.length });
    } catch (error) {
        res.json({ totalAccounts: 0 });
    }
});

app.get('/api/temp-mail', async (req, res) => {
    try {
        const response = await axios.get(CONFIG.temp_mail_api);
        res.json(response.data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Serve frontend
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});