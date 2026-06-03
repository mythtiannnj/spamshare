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

function generateUserAgent() {
    const androidVersions = ['10', '11', '12', '13', '14'];
    const chromeVersions = ['120', '121', '122', '123', '124'];
    const devices = ['SM-G998B', 'Pixel 7 Pro', 'OnePlus 11', 'Xiaomi 13 Pro', 'OPPO Find X6'];
    
    const androidVer = androidVersions[Math.floor(Math.random() * androidVersions.length)];
    const chromeVer = chromeVersions[Math.floor(Math.random() * chromeVersions.length)];
    const device = devices[Math.floor(Math.random() * devices.length)];
    const buildVer = Math.floor(Math.random() * 9000) + 1000;
    const patchVer = Math.floor(Math.random() * 150) + 70;
    
    return `Mozilla/5.0 (Linux; Android ${androidVer}; ${device}) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${chromeVer}.0.${buildVer}.${patchVer} Mobile Safari/537.36`;
}

function generatePassword() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    let password = '';
    for (let i = 0; i < 12; i++) {
        password += chars[Math.floor(Math.random() * chars.length)];
    }
    return password;
}

function generateBDPhone() {
    const prefixes = ['17', '18', '19', '16', '15', '13', '14'];
    const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
    let number = '';
    for (let i = 0; i < 8; i++) {
        number += Math.floor(Math.random() * 10);
    }
    return `${prefix}${number}`;
}

function generateMixedPhone() {
    const prefixes = {
        '1': ['201', '202', '303', '312', '415', '646', '718'],
        '44': ['7400', '7500', '7600', '7700', '7800', '7900'],
        '63': ['917', '918', '919', '920', '921', '922'],
        '62': ['813', '815', '816', '817', '818', '819']
    };
    const codes = Object.keys(prefixes);
    const code = codes[Math.floor(Math.random() * codes.length)];
    const prefixList = prefixes[code];
    const prefix = prefixList[Math.floor(Math.random() * prefixList.length)];
    let number = '';
    const length = code === '44' ? 6 : 7;
    for (let i = 0; i < length; i++) {
        number += Math.floor(Math.random() * 10);
    }
    return `${code}${prefix}${number}`;
}

function generateTempEmail() {
    const domains = ['guerrillamail.com', '10minutemail.com', 'tempmail.com', 'mailinator.com'];
    const username = crypto.randomBytes(6).toString('hex');
    return `${username}@${domains[Math.floor(Math.random() * domains.length)]}`;
}

function getRandomName() {
    return {
        first: firstNames[Math.floor(Math.random() * firstNames.length)],
        last: surnames[Math.floor(Math.random() * surnames.length)]
    };
}

function extractFormData(html) {
    const $ = cheerio.load(html);
    const formData = {};
    $('input').each((i, elem) => {
        const name = $(elem).attr('name');
        const value = $(elem).attr('value') || '';
        if (name) formData[name] = value;
    });
    return formData;
}

async function saveAccount(account) {
    const filePath = path.join(CONFIG.output_dir, 'created_accounts.txt');
    const line = `${account.uid}|${account.email}|${account.password}|${account.cookies}|${new Date().toISOString()}\n`;
    await fs.appendFile(filePath, line);
}

async function createFacebookAccount(emailType, customPassword = null) {
    const session = axios.create({
        timeout: 30000,
        maxRedirects: 5,
        validateStatus: status => status < 500
    });
    
    try {
        const userAgent = generateUserAgent();
        const headers = {
            'User-Agent': userAgent,
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.9',
            'Accept-Encoding': 'gzip, deflate, br',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1'
        };
        
        const regResponse = await session.get(CONFIG.facebook_reg_url, { headers });
        if (regResponse.status !== 200) {
            throw new Error(`Failed to load registration page: ${regResponse.status}`);
        }
        
        const formData = extractFormData(regResponse.data);
        const { first, last } = getRandomName();
        const password = customPassword || generatePassword();
        
        let contact;
        if (emailType === 'temp') {
            contact = generateTempEmail();
        } else if (emailType === 'mixed') {
            contact = generateMixedPhone();
        } else {
            contact = generateBDPhone();
        }
        
        const birthdayDay = Math.floor(Math.random() * 28) + 1;
        const birthdayMonth = Math.floor(Math.random() * 12) + 1;
        const birthdayYear = Math.floor(Math.random() * 15) + 1985;
        
        const payload = {
            reg_instance: formData.reg_instance || '',
            email: emailType === 'temp' ? contact : '',
            phone_number: emailType !== 'temp' ? contact : '',
            firstname: first,
            lastname: last,
            birthday_day: birthdayDay,
            birthday_month: birthdayMonth,
            birthday_year: birthdayYear,
            sex: '1',
            password: password,
            submit: 'Sign Up',
            lsd: formData.lsd || '',
            jazoest: formData.jazoest || ''
        };
        
        Object.keys(payload).forEach(key => {
            if (payload[key] === '') delete payload[key];
        });
        
        const submitHeaders = {
            ...headers,
            'Content-Type': 'application/x-www-form-urlencoded',
            'Origin': 'https://m.facebook.com',
            'Referer': CONFIG.facebook_reg_url
        };
        
        await session.post(CONFIG.facebook_submit_url, new URLSearchParams(payload).toString(), { headers: submitHeaders });
        
        const cookies = session.defaults.headers.common['Cookie'] || '';
        const cookieJar = {};
        
        if (cookies) {
            cookies.split(';').forEach(cookie => {
                const [key, value] = cookie.trim().split('=');
                if (key && value) cookieJar[key] = value;
            });
        }
        
        const uid = cookieJar.c_user;
        
        if (uid) {
            const cookieString = Object.entries(cookieJar).map(([k, v]) => `${k}=${v}`).join('; ');
            const result = {
                success: true,
                uid: uid,
                password: password,
                email: contact,
                name: `${first} ${last}`,
                gender: 'Female',
                dob: `${birthdayDay}/${birthdayMonth}/${birthdayYear}`,
                cookies: cookieString
            };
            await saveAccount(result);
            return result;
        }
        
        return { success: false, error: 'Registration failed - no UID received' };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

// API Routes
app.post('/api/create-accounts', async (req, res) => {
    const { emailType, passwordType, customPassword, count } = req.body;
    
    if (!count || count < 1 || count > 20) {
        return res.status(400).json({ error: 'Count must be between 1 and 20' });
    }
    
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    
    for (let i = 0; i < count; i++) {
        try {
            const finalPassword = passwordType === 'custom' ? customPassword : null;
            const result = await createFacebookAccount(emailType, finalPassword);
            
            if (result.success) {
                res.write(`data: ${JSON.stringify({ type: 'success', data: result, current: i + 1, total: count })}\n\n`);
            } else {
                res.write(`data: ${JSON.stringify({ type: 'error', data: result, current: i + 1, total: count })}\n\n`);
            }
        } catch (error) {
            res.write(`data: ${JSON.stringify({ type: 'error', data: { error: error.message }, current: i + 1, total: count })}\n\n`);
        }
        await new Promise(resolve => setTimeout(resolve, 3000));
    }
    
    res.write(`data: ${JSON.stringify({ type: 'complete' })}\n\n`);
    res.end();
});

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

app.delete('/api/accounts', async (req, res) => {
    try {
        const filePath = path.join(CONFIG.output_dir, 'created_accounts.txt');
        await fs.writeFile(filePath, '');
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`\n╔════════════════════════════════════════════╗`);
    console.log(`║   CYBER-X Facebook Account Creator       ║`);
    console.log(`║   Server running on: http://localhost:${PORT} ║`);
    console.log(`╚════════════════════════════════════════════╝\n`);
});