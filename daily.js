//const { EmbedBuilder, WebhookClient } = require('discord.js');
const fs = require('fs');
const path = require('path');
const csv = require('fast-csv');
//var cron = require('node-cron');
const request = require("request");
var moment = require('moment-timezone');

const phrasesArray = [ 
        "Makan malam?",
        "Cinta adalah kunci",
        "Node.js hebat!",
        "Api hutan liar",
        "Santai sebentar",
        "Teknologi masa depan",
        "Bersepeda sore ini",
        "Gajah berlari cepat",
        "Musim gugur indah",
        "Malam ini, langit penuh dengan kedipan bintang.",
        "Saya menemukan gumpal awan putih di langit pagi tadi.",
        "Suara serunai alunan musik memenuhi ruangan.",
        "Cahaya matahari yang menyilaukan memasuki jendela.",
        "Warna jingga senja memancar di ufuk barat.",
        "Semburat warna-warni menghiasi lukisan indah itu.",
        "Rumbai-rumbai daun bergoyang ditiup angin lembut.",
        "Keberanian anak itu kian terpancar dari matanya.",
        "Cahaya kemerlap lampu jalan menyoroti trotoar.",
        "Seekor kupu-kupu terbang di sekitar rongga bunga."
    ];

class LimitedList {
        constructor(maxItems) {
            this.maxItems = maxItems;
            this.list = [];
        }
    
        addData(data) {
            // Tambahkan data ke dalam list
            this.list.push(data);
    
            // Jika jumlah item melebihi batas maksimal, hapus item pertama
            if (this.list.length > this.maxItems) {
                this.list.shift();
            }
        }
    
        getData() {
            // Kembalikan list saat ini
            return this.list;
        }
        getJoinedData() {
            return this.list.join('\r\n');
        }
    }

    const limitedList = new LimitedList(22);

var no_nodes = process.argv[2];

var enable_talking = false
//proxy

var host = "p.webshare.io"
var port = 80
var user = "eaqywrux-" + no_nodes
var pass = "8xrqmoixjgm8"
var proxyUrl = "http://" + user + ":" + pass + "@" + host + ":" + port;

var proxiedRequest = request.defaults({'proxy': proxyUrl});

// CONFIG LOCAL

var config_global = require("./config/daily.json");

var setting = config_global.node[no_nodes]
// di ganti variable setting

var array_channel = setting.daily_channel
var array_talk_channel = setting.talk_channel
//var hook_url = setting.hook_url
//var hook_id = setting.hook_id
//var control_channel = setting.control_channel
// Array untuk menyimpan nama
var array_name = [];
var array_token = [];
var array_dm = [];

var array_hook = [];
var max_channel,max_kalimat
var total_acc
global.flag_err = 0

const sleep = (milliseconds) => {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            resolve()
        }, milliseconds)
    })
}


const akun = async (token) => {
    console.log("cek akun " + token)
    return new Promise((resolve, reject) => {
        proxiedRequest.get({
            headers: {
                authorization: token
            },
            url: "https://canary.discord.com/api/v9/users/@me"
        }, function (error, response, body) {
            var bod = JSON.parse(body);
            if(error)
            {
                reject("ERROR CEK AKUN")
            }
            if (String(bod.message) === "401: Unauthorized") {
                resolve("ERROR 401 UNAUTORIZED")
            } else {
                resolve("login as: " + bod.username)
            }
        })
    })
}

const reply = async (token,channel) => {
    console.log("reply function enter")
    return new Promise((resolve, reject) => {
        proxiedRequest.get({
            headers: {
                authorization: token
            },
            url: "https://discord.com/api/v9/channels/" + channel + "/messages?limit=1"
        }, function (error, response, body) {
            if (!error && response.statusCode) {
                if (response.statusCode != 200) {
                    reject("response code not 200")
                    return
                }
                let bod = JSON.parse(body);
                let cont = bod[0].content;
                var owo_bot_id = '408785106942164992';

                if (bod[0].author.id != owo_bot_id) {
                    reject("reply not from OWO")
                    console.log("replay not from owo")
                    return
                } else {
                    if (cont.includes("following")) {
                        url = bod[0]
                            .attachments[0]
                            .url;
                        resolve(3)
                        console.log("captcha image !")
                        return
                    }
                    else if (cont.includes("captcha")) {
                        console.log("captcha web !")
                        resolve(2)
                        return
                    }
                    else {
                        console.log("owo replied | " + bod[0].author.id ) 
                        resolve(1)
                        return
                    }
                }
            }
            else {
                reject("error response cek ban:" + error)
                console.log("error resposen cek ban" + error)
            }
        })
    })
}

const talking = async (token,list,counter) => {
        try {
            max_channel = array_talk_channel.length
            max_kalimat = phrasesArray.length
            let xrandom_chanel = rand(0,max_channel)
            await sleep(rand(1, 10) * 200)
            await sendText(token, array_talk_channel[xrandom_chanel], phrasesArray[rand(0,max_kalimat)])
        }
        catch (e) {
            console.log("catch error:" + e)
            await sleep(rand(1, 10) * 4000)
        }
}
const cek_dm = async (token,dm_id) => {
    console.log("function cek dm")
    return new Promise((resolve, reject) => {
        proxiedRequest.get({
                    headers: {
                        authorization: token
                    },
                    url: "https://discord.com/api/v9/channels/" + dm_id + "/messages?limit=1"
                }, function (error, response, body) {
                    if (!error && response.statusCode) {
                        if (response.statusCode != 200) {
                            reject("cek dm response code not 200")
                            return
                        }
                        var bod = JSON.parse(body);
                        var isi = bod[0].content;

                        if (isi.includes("following")) {
                            url = bod[0]
                                .attachments[0]
                                .url;
                            resolve(3)
                        }
                        else if (isi.includes("Are you a real human?")) {
                            resolve(2)
                        }
                        else
                        {
                            resolve(1)
                        }
                    }
              })
    });
            
}
const cek_banned = async (token,dm_id,channel) => {
    let counter = 0, hasil = 0;
    let got_error = ""
    do {
            console.log("function cek banned")
            if (counter < 30) {
                //console.log("flag 1")
                try {
                    hasil = await reply(token,channel)
                }
                catch (e) {
                    await sleep(1000)
                }
            }
            /*
            else if (counter > 30) {
                console.log("cek DM")
                try {
                hasil = await cek_dm(token,dm_id);
                }
                catch (e) {
                    got_error = "catch error in cek reply: " + e
                    return got_error
                }
            }
            */
            if (hasil == 2 || hasil == 3) {
                // ada captcha
                return "GOT CAPTCHA"
            }
            if (counter > 40) {
                hasil = 1
                return("OVERFLOW " + got_error)
            }
            console.log(got_error)
            counter++
        await sleep(1000)
    } while (hasil != 1)
    console.log("passed")
    return "PASSED"
}

const daily = async (token,dm_id,list) => {
    
        max_channel = array_channel.length
        let random_chanel = rand(0,max_channel)
        channel = array_channel[random_chanel]
        let info, ban;
        // kirim text owo daily
        try{
            await sendText(token, channel, "owo daily")
            // cek response dari owo apakah ada captcha
            await sleep(2000)
            ban = await cek_banned(token,dm_id,channel)
            info = "[DAILY] BOT " + list + " channel " + random_chanel + " -> Status: " + ban
        }
        catch(e)
        {
            info = "[DAILY] BOT " + list + " channel " + random_chanel + " -> Status: " + e
            global.flag_err += 1
        }
        limitedList.addData(moment().format("hh:mm:ss") + ' > ' + info);
}

const cekproxy = async () => {

    return new Promise((resolve, reject) => {
    console.log("cek ip")
        proxiedRequest.get({
            url: "http://api.ipify.org"
        }, function (error, response, body) {
            if(error || response.statusCode != 200)
            {
                console.log("error" + error + " | response " + response.statusCode)
                resolve("error" + error + " | response " + response.statusCode)
            }
            else
            {
                console.log("my ip " + body)
                resolve(body)
            }
        
        })
    })
    }

const load_acc = () => {
    return new Promise((resolve, reject) => {
      fs.createReadStream(path.resolve(__dirname, 'akun', no_nodes + '.csv'))
      .pipe(csv.parse({ headers: true }))
      .on('error', error => reject(error))
      .on('data', row => {
        array_dm.push(row.dm);
        array_token.push(row.token);
      })
      .on('end', rowCount => resolve());
    })
    };


    const webhookUrl = 'https://discord.com/api/webhooks/1208969753327304714/sJ5TxnSJflDzCDJ600Um_919QsfAaNH5N1spA3AkZZcKetJ2tblVYNdHB1HB4lJzP4vz';

    // Fungsi untuk mengirim pesan ke webhook dengan embed
const update = async (isi) => {
    console.log("update hook")
      const embed = {
        title: "NODE " + no_nodes + " ERROR " + global.flag_err,
        description: isi,
        color: 5763719,
        footer: {
            text: "Last update " + moment().format("YY/MM/DD hh:mm:ss")
          }
      };
    
      const options = {
        uri: webhookUrl,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        json: {
          embeds: [embed],
        },
      };
    
       request(options, (error, response, body) => {
        if (error) {
          console.error('Gagal mengirim pesan ke Discord:', error);
        } else {
          console.log('Pesan berhasil dikirim ke Discord: ' +  response.statusCode);
        }
      });
    }
    
// Panggil fungsi update
var myip = "???"
const main = async () => {
    try {
        await load_acc(); // Menunggu pemenuhan promise dari load_acc
        myip = await cekproxy()
        //limitedList.addData(myip)
        //await sendText(array_token[0], control_channel, "BOT READY")
        total_acc = array_token.length
        // akun cek here
        /*
        for(i=0; i < total_acc;i++)
        {   
            let cek_akun = await akun(array_token[i])
            limitedList.addData("BOT " + (i + 1) + " | " + cek_akun);
            console.log(cek_akun)
            await sleep(1000)
        }
        */
        limitedList.addData("BOT: " + total_acc + " | IP: " + myip);
        for(i=0; i < total_acc; i++)
        {   
            console.log("BOT " + i)
            await daily(array_token[i],array_dm[i], i + 1 )
            await sleep(1000)
        }
        await update(limitedList.getJoinedData());
        await sleep(3000)
        console.log("FINISH ACTION!")
        process.exit(1)
        // Lakukan operasi atau tindakan lainnya dengan array_token di sini
    } catch (error) {
        console.error('Error:', error);
        await update('Error main:', error);
    }
    };
    
const loop_daily = async (total) => {
    limitedList.addData("BOT: " + total + " | IP: " + myip);
    for(i=0; i < total;i++)
    {   
        console.log("BOT " + i)
        await daily(array_token[i],array_dm[i], i + 1 )
        await sleep(1000)
    }
    await update(limitedList.getJoinedData()); //update data
}
// baca nilai token semua
main()

/*
var counter = 1
if( enable_talking == true)
{
setInterval( async () => {
    for(i=0; i < array_token.length;i++)
    {   
        await talking(array_token[i], i+1 , counter)
        await sleep(1000)
    }
    console.log("talking " + counter)
    counter++
}, 120 * 1000);
}
var date_start = moment().format("YY/MM/DD hh:mm:ss")
*/
/*
setInterval( async () => {
    let master_token = "MzM0NTU1MDA3NzIwNDg4OTYx.Gd37_U.Bcg7qZZaEvIJZo0ENOwSfX4wTDWTTchcuGmQ3A" //KIK
    let master_channel = "1202538965404753991" // channel control
    try{
        let control = await read_response(master_token, master_channel, 3000)
        if(control.includes("aily"))
        {
            let arrayKata = control.split(' ');
            let arg1 = arrayKata[0];
            let arg2 = arrayKata[1];
            if(!arg2)
                if(arg2 == no_nodes)
                {
                    await sendText(master_token, master_channel, "OK!")
                    await loop_daily(total_acc);
                }
            else
            {
                await sendText(master_token, master_channel, "OK!")
                await loop_daily(total_acc);
            }
        }
        /*
        switch(control)
        {
            case "reboot":
                await sendText(master_token, master_channel, "OK!")
                process.exit(1)
                break;
            case "add":
                await sendText(master_token, master_channel, "OK!")
                break;
            case "user":
                await sendText(master_token, master_channel, "total:" + array_token.length)
                break;
            case "ping":
                await sendText(master_token, master_channel, "pong!")
                break;
            case "give":
                await sendText(master_token, master_channel, "OK!")
                break;
            case "daily":
                await sendText(master_token, master_channel, "OK!")
                await loop_daily(total_acc);
                break;
        }
    }
    catch(e)
    {
        console.log("error interval control " + e)
    }
    console.log("listening..")
}, 90000 + rand(100,2000));
*/
/*
const batch_hook = async (text) => {
    const disc = new WebhookClient({url: hook_url});
    await disc.editMessage(hook_id, {
        description: "",
        content: "",
        "embeds": [
            {
                "type": "rich",
                "title": "NODE " + no_nodes ,
                "color": 0x66ff00,
                "fields": [
                    {
                        "name": `Uptime:`,
                        "value": format(process.uptime())
                    },
                    {
                        "name": `Total Akun:`,
                        "value": array_token.length
                    },
                    {
                        "name": `Start:`,
                        "value": date_start
                    },
                    {
                        "name": `data:`,
                        "value": text
                    },
                    {
                        "name": `last updated:`,
                        "value": moment().format("YY/MM/DD hh:mm:ss")
                    }
                ]
            }
        ]
    })
}
*/
const read_response = (token,channel,milliseconds) => {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
                    request.get({
                        headers: {
                            authorization: token
                        },
                        url: "https://discord.com/api/v9/channels/" + channel + "/messages?limit=1"
                    }, function (error, response, body) {
                        if (!error && response.statusCode == 200) {
                            var isi = JSON.parse(body);
                            var isi_content = isi[0].content
                            resolve(isi_content)
                        } else {
                            reject(error)
                        }
                    })
                    }, milliseconds)
        })
}


function parse(mode, text) {
    let hasil = "none"
    let filter
    if (mode == 'cash') {
        const regex = /\*\*__([\d,]+)__\s+cowoncy/;
        const match = text.match(regex);

        // Mendapatkan nilai dari hasil pencocokan
        hasil = match && match[1];
    }
    else if (mode == 'level') {
        const regex = /[\s\t]+Lvl\s+\d+\s+\d+xp/;
        const match = text.match(regex);

        // Mendapatkan nilai dari hasil pencocokan
        const result = match && match[0];
        
        hasil = result && result.replace(/\s+/g, ' ');
        console.log("parse:" + hasil)
/*
        const regex2 = /Lvl\s*\d+/; // Pola regex untuk mencocokkan "Lvl" diikuti oleh angka
        
        const match2 = hasil.match(regex2);
        console.log("rexeg match:" + hasil)
        hasil = match2 && match2[0]
        log("[LEVEL] ----> " + result)
        */
    }
    return hasil
}
function rand(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min) + min); // The maximum is exclusive and the minimum is inclusive
}

async function sendText(token,channelId, isi) {

    return new Promise((resolve, reject) => {
        proxiedRequest.post({
            headers: {
                authorization: token
            },
            url: `https://discord.com/api/v9/channels/${channelId}/messages`,
            json: {
                content: isi,
                nonce: nonce(),
                tts: false,
                flags: 0
            }
        }, (error, response, body) => {
                if (!error && response.statusCode)
                {
                    if (response?.statusCode != 200) {
                        reject("status code: " + response.statusCode + " | token: " + token + " | " + isi)
                        return
                    }
                    resolve()
                    return
                }
                else
                {
                    reject("error send text: " + error + " | token: " + token + " | " + isi)
                    return
                }
        });
    });
}
function nonce() {
    return "1098393848631590" + Math.floor(Math.random() * 9999);
}
function format(detik) {
    function pad(s) {
        return (
            s < 10
                ? '0'
                : ''
        ) + s;
    }
    let hours = Math.floor(detik / (60 * 60));
    let minutes = Math.floor(detik % (60 * 60) / 60);
    let seconds = Math.floor(detik % 60);

    return pad(hours) + ':' + pad(minutes) + ':' + pad(seconds);
}

