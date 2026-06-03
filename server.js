const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const cors = require('cors');
const path = require('path');
const fs = require('fs').promises;
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Configuration
const CONFIG = {
    output_dir: path.join(__dirname, 'output'),
    facebook_reg_url: 'https://m.facebook.com/reg/',
    facebook_submit_url: 'https://m.facebook.com/reg/submit/',
    facebook_confirm_url: 'https://m.facebook.com/confirmemail.php'
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
    BD: { code: '88', prefixes: ['17', '18', '19', '16', '15', '13', '14'], length: 8 },
    PH: { code: '63', prefixes: ['917', '918', '919', '920', '921', '922'], length: 7 },
    ID: { code: '62', prefixes: ['813', '815', '816', '817', '818', '819'], length: 7 },
    IN: { code: '91', prefixes: ['98', '99', '97', '96', '95', '94'], length: 8 },
    PK: { code: '92', prefixes: ['300', '301', '302', '303', '304', '305'], length: 7 },
    US: { code: '1', prefixes: ['201', '202', '303', '312', '415', '646', '718'], length: 7 }
};

// Generate random User-Agent
function generateUserAgent() {
    const androidVersions = ['10', '11', '12', '13', '14'];
    const chromeVersions = ['120', '121', '122', '123', '124'];
    const devices = [
        'SM-G998B', 'Pixel 7 Pro', 'OnePlus 11', 'Xiaomi 13 Pro', 
        'OPPO Find X6', 'Realme GT 3', 'vivo X90 Pro'
    ];
    
    const androidVer = androidVersions[Math.floor(Math.random() * androidVersions.length)];
    const chromeVer = chromeVersions[Math.floor(Math.random() * chromeVersions.length)];
    const device = devices[Math.floor(Math.random() * devices.length)];
    const buildVer = Math.floor(Math.random() * 9000) + 1000;
    const patchVer = Math.floor(Math.random() * 150) + 70;
    
    return `Mozilla/5.0 (Linux; Android ${androidVer}; ${device}) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${chromeVer}.0.${buildVer}.${patchVer} Mobile Safari/537.36`;
}

// Generate random password
function generatePassword() {
    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const lowercase = 'abcdefghijklmnopqrstuvwxyz';
    const numbers = '0123456789';
    const symbols = '!@#$%^&*';
    
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
function generatePhoneNumber(type = 'bd') {
    if (type === 'bd') {
        const prefixes = ['17', '18', '19', '16', '15', '13', '14'];
        const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
        let number = '';
        for (let i = 0; i < 8; i++) {
            number += Math.floor(Math.random() * 10);
        }
        return `${prefix}${number}`;
    } else if (type === 'mixed') {
        const countries = Object.keys(phoneConfigs);
        const country = countries[Math.floor(Math.random() * countries.length)];
        const config = phoneConfigs[country];
        const prefix = config.prefixes[Math.floor(Math.random() * config.prefixes.length)];
        let number = '';
        for (let i = 0; i < config.length; i++) {
            number += Math.floor(Math.random() * 10);
        }
        return `${prefix}${number}`;
    }
    return generateTempEmail();
}

// Generate temp email
function generateTempEmail() {
    const domains = ['guerrillamail.com', '10minutemail.com', 'tempmail.com'];
    const username = crypto.randomBytes(6).toString('hex');
    return `${username}@${domains[Math.floor(Math.random() * domains.length)]}`;
}

// Get random name
function getRandomName() {
    return {
        first: firstNames[Math.floor(Math.random() * firstNames.length)],
        last: surnames[Math.floor(Math.random() * surnames.length)]
    };
}

// Extract form data from HTML
function extractFormData(html) {
    const $ = cheerio.load(html);
    const formData = {};
    
    $('input').each((i, elem) => {
        const name = $(elem).attr('name');
        const value = $(elem).attr('value') || '';
        if (name && !formData[name]) {
            formData[name] = value;
        }
    });
    
    return formData;
}

// Save account to file
async function saveAccount(account) {
    const filePath = path.join(CONFIG.output_dir, 'created_accounts.txt');
    const line = `${account.uid}|${account.email}|${account.password}|${account.cookies}|${new Date().toISOString()}\n`;
    await fs.appendFile(filePath, line);
}

// Create Facebook account
async function createFacebookAccount(emailType, customPassword = null) {
    const session = axios.create({
        timeout: 30000,
        maxRedirects: 5,
        validateStatus: status => status < 500
    });
    
    try {
        // Step 1: Get registration page and extract tokens
        const userAgent = generateUserAgent();
        const headers = {
            'User-Agent': userAgent,
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.9',
            'Accept-Encoding': 'gzip, deflate, br',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1',
            'Cache-Control': 'max-age=0'
        };
        
        const regResponse = await session.get(CONFIG.facebook_reg_url, { headers });
        
        if (regResponse.status !== 200) {
            throw new Error(`Failed to load registration page: ${regResponse.status}`);
        }
        
        const formData = extractFormData(regResponse.data);
        
        // Step 2: Prepare registration data
        const { first, last } = getRandomName();
        const password = customPassword || generatePassword();
        
        // Generate contact based on type
        let contact;
        let contactType = 'email';
        
        if (emailType === 'temp') {
            contact = generateTempEmail();
            contactType = 'email';
        } else if (emailType === 'mixed') {
            contact = generatePhoneNumber('mixed');
            contactType = 'phone';
        } else {
            contact = generatePhoneNumber('bd');
            contactType = 'phone';
        }
        
        const birthdayDay = Math.floor(Math.random() * 28) + 1;
        const birthdayMonth = Math.floor(Math.random() * 12) + 1;
        const birthdayYear = Math.floor(Math.random() * 15) + 1985;
        
        const payload = {
            'reg_instance': formData.reg_instance || '',
            'email': contactType === 'email' ? contact : '',
            'phone_number': contactType === 'phone' ? contact : '',
            'firstname': first,
            'lastname': last,
            'birthday_day': birthdayDay,
            'birthday_month': birthdayMonth,
            'birthday_year': birthdayYear,
            'sex': '1',
            'custom_gender': '',
            'reg_email_confirmation_': contactType === 'email' ? contact : '',
            'password': password,
            'submit': 'Sign Up',
            'lsd': formData.lsd || '',
            'jazoest': formData.jazoest || '',
            'm_ts': Date.now(),
            'li': formData.li || '',
            'reg_mail': contactType === 'email' ? contact : '',
            'reg_phone': contactType === 'phone' ? contact : ''
        };
        
        // Clean up payload (remove empty values)
        Object.keys(payload).forEach(key => {
            if (payload[key] === '' && key !== 'custom_gender') {
                delete payload[key];
            }
        });
        
        // Step 3: Submit registration
        const submitHeaders = {
            ...headers,
            'Content-Type': 'application/x-www-form-urlencoded',
            'Origin': 'https://m.facebook.com',
            'Referer': CONFIG.facebook_reg_url,
            'Host': 'm.facebook.com'
        };
        
        const submitResponse = await session.post(
            CONFIG.facebook_submit_url,
            new URLSearchParams(payload).toString(),
            { headers: submitHeaders }
        );
        
        // Step 4: Check cookies for successful registration
        const cookies = session.defaults.headers.common['Cookie'] || '';
        const cookieJar = {};
        
        if (cookies) {
            cookies.split(';').forEach(cookie => {
                const [key, value] = cookie.trim().split('=');
                if (key && value) cookieJar[key] = value;
            });
        }
        
        // Also try to get cookies from response headers
        if (submitResponse.headers['set-cookie']) {
            const setCookies = submitResponse.headers['set-cookie'];
            setCookies.forEach(cookie => {
                const [key, value] = cookie.split(';')[0].split('=');
                if (key && value) cookieJar[key] = value;
            });
        }
        
        const uid = cookieJar.c_user;
        
        if (uid && submitResponse.status === 200) {
            const cookieString = Object.entries(cookieJar).map(([k, v]) => `${k}=${v}`).join('; ');
            
            const result = {
                success: true,
                uid: uid,
                password: password,
                email: contact,
                name: `${first} ${last}`,
                gender: 'Female',
                dob: `${birthdayDay}/${birthdayMonth}/${birthdayYear}`,
                cookies: cookieString,
                status: 'active'
            };
            
            await saveAccount(result);
            return result;
        } else if (submitResponse.data && submitResponse.data.includes('checkpoint')) {
            return {
                success: false,
                error: 'Account requires checkpoint verification',
                checkpoint: true
            };
        } else {
            return {
                success: false,
                error: 'Registration failed - unknown error',
                status: submitResponse.status
            };
        }
        
    } catch (error) {
        console.error('Creation error:', error.message);
        return {
            success: false,
            error: error.message
        };
    }
}

// Bulk create accounts with SSE
app.post('/api/create-accounts', async (req, res) => {
    const { emailType, passwordType, customPassword, count, showDetails } = req.body;
    
    if (!count || count < 1 || count > 50) {
        return res.status(400).json({ error: 'Count must be between 1 and 50' });
    }
    
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('Access-Control-Allow-Origin', '*');
    
    const results = {
        success: [],
        failed: [],
        total: count
    };
    
    for (let i = 0; i < count; i++) {
        try {
            const finalPassword = passwordType === 'custom' ? customPassword : null;
            const result = await createFacebookAccount(emailType, finalPassword);
            
            if (result.success) {
                results.success.push(result);
                res.write(`data: ${JSON.stringify({ 
                    type: 'success', 
                    data: result, 
                    progress: { 
                        current: i + 1, 
                        total: count, 
                        success: results.success.length, 
                        failed: results.failed.length 
                    } 
                })}\n\n`);
            } else {
                results.failed.push(result);
                res.write(`data: ${JSON.stringify({ 
                    type: 'error', 
                    data: result, 
                    progress: { 
                        current: i + 1, 
                        total: count, 
                        success: results.success.length, 
                        failed: results.failed.length 
                    } 
                })}\n\n`);
            }
        } catch (error) {
            results.failed.push({ error: error.message });
            res.write(`data: ${JSON.stringify({ 
                type: 'error', 
                data: { error: error.message }, 
                progress: { 
                    current: i + 1, 
                    total: count, 
                    success: results.success.length, 
                    failed: results.failed.length 
                } 
            })}\n\n`);
        }
        
        // Delay between requests
        await new Promise(resolve => setTimeout(resolve, 3000));
    }
    
    res.write(`data: ${JSON.stringify({ type: 'complete', results })}\n\n`);
    res.end();
});

// Get all accounts
app.get('/api/accounts', async (req, res) => {
    try {
        const filePath = path.join(CONFIG.output_dir, 'created_accounts.txt');
        const content = await fs.readFile(filePath, 'utf-8').catch(() => '');
        const accounts = content.split('\n')
            .filter(line => line.trim())
            .map(line => {
                const [uid, email, password, cookies, date] = line.split('|');
                return { uid, email, password, date: date || new Date().toISOString() };
            })
            .reverse();
        res.json(accounts);
    } catch (error) {
        res.json([]);
    }
});

// Delete all accounts
app.delete('/api/accounts', async (req, res) => {
    try {
        const filePath = path.join(CONFIG.output_dir, 'created_accounts.txt');
        await fs.writeFile(filePath, '');
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get stats
app.get('/api/stats', async (req, res) => {
    try {
        const filePath = path.join(CONFIG.output_dir, 'created_accounts.txt');
        const content = await fs.readFile(filePath, 'utf-8').catch(() => '');
        const accounts = content.split('\n').filter(line => line.trim());
        res.json({ totalAccounts: accounts.length });
    } catch (error) {
        res.json({ totalAccounts: 0 });
    }
});

// Serve frontend
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start server
app.listen(PORT, () => {
    console.log(`\n╔════════════════════════════════════════════╗`);
    console.log(`║   CYBER-X Facebook Account Creator       ║`);
    console.log(`║   Server running on:                     ║`);
    console.log(`║   http://localhost:${PORT}                  ║`);
    console.log(`╚════════════════════════════════════════════╝\n`);
});