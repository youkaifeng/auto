"use strict"

/*---------------依赖-----------------*/
const nodeMailer = require('nodemailer');
const axios = require('axios');

/*---------------配置-----------------*/
const config = {
    "baseUrl": "https://api.juejin.cn",
    "apiUrl": {
        "getTodayStatus": "/growth_api/v1/get_today_status",
        "checkIn": "/growth_api/v1/check_in",
        "getLotteryConfig": "/growth_api/v1/lottery_config/get",
        "drawLottery": "/growth_api/v1/lottery/draw",
        "global_big": "/growth_api/v1/lottery_history/global_big?aid=2608&uuid=7108547671534667271&spider=0",
        "dip_lucky": "/growth_api/v1/lottery_lucky/dip_lucky?aid=2608&uuid=7108547671534667271&spider=0",
    },
    "cookie": '_ga=GA1.2.1735536519.1655087666; _tea_utm_cache_2608=undefined; __tea_cookie_tokens_2608=%257B%2522web_id%2522%253A%25227108547671534667271%2522%252C%2522user_unique_id%2522%253A%25227108547671534667271%2522%252C%2522timestamp%2522%253A1655087665957%257D; MONITOR_WEB_ID=2283d21c-2147-49b4-acfb-d884e456c7df; _gid=GA1.2.559944146.1667985478; passport_csrf_token=da0334ac4da3de435b65359e2f3a1d30; passport_csrf_token_default=da0334ac4da3de435b65359e2f3a1d30; _tea_utm_cache_2018=undefined; odin_tt=4ad794e9ccfc16f78eaaead5560a25e7c9c2c03eb598e0544178b6d3a761e87ca450e858e58fa195183e9b8aca455d97c45a883a1431b2941f5c5ca950440108; n_mh=-I6iTqUBvSyp2DGZ0x000aa5mbO81oQYteUIUdkIAjw; passport_auth_status=cfff7babaac3324848e120fe3eec2a2c%2C; passport_auth_status_ss=cfff7babaac3324848e120fe3eec2a2c%2C; uid_tt=127e80f8bf5fb9205fac6e7df867e918; uid_tt_ss=127e80f8bf5fb9205fac6e7df867e918; sid_tt=c7fc87f6274787500e8659eb8700573a; sessionid=c7fc87f6274787500e8659eb8700573a; sessionid_ss=c7fc87f6274787500e8659eb8700573a; sid_guard=c7fc87f6274787500e8659eb8700573a%7C1667985591%7C31536000%7CThu%2C+09-Nov-2023+09%3A19%3A51+GMT; sid_ucp_v1=1.0.0-KDVkNDIyNGU0NmE2NDFjMjBhYTZlNGIxMWJlMTM3N2JlZjZjMmQ4YTcKFwidspC464yLBBC34a2bBhiwFDgCQPIHGgJsZiIgYzdmYzg3ZjYyNzQ3ODc1MDBlODY1OWViODcwMDU3M2E; ssid_ucp_v1=1.0.0-KDVkNDIyNGU0NmE2NDFjMjBhYTZlNGIxMWJlMTM3N2JlZjZjMmQ4YTcKFwidspC464yLBBC34a2bBhiwFDgCQPIHGgJsZiIgYzdmYzg3ZjYyNzQ3ODc1MDBlODY1OWViODcwMDU3M2E',
    "email": {
        "qq": {
            "user": "1582540778@qq.com",
            "from": "1582540778@qq.com",
            "to": "1582540778@qq.com",
            "pass": "ngxwaehbmseifhcj"
        }
    }
}

/*---------------掘金-----------------*/

// 签到
const checkIn = async () => {
    let {error, isCheck} = await getTodayCheckStatus();
    if (error) return console.log('查询签到失败');
    if (isCheck) return console.log('今日已参与签到');
    const {cookie, baseUrl, apiUrl} = config;
    let {data} = await axios({url: baseUrl + apiUrl.checkIn, method: 'post', headers: {Cookie: cookie}});
    if (data.err_no) {
        console.log('签到失败');
        await sendEmailFromQQ('今日掘金签到：失败', JSON.stringify(data));
    } else {
        console.log(`签到成功！当前积分：${data.data.sum_point}`);
        await sendEmailFromQQ('今日掘金签到：成功', JSON.stringify(data));
    }
}

// 查询今日是否已经签到
const getTodayCheckStatus = async () => {
    const {cookie, baseUrl, apiUrl} = config;
    let {data} = await axios({url: baseUrl + apiUrl.getTodayStatus, method: 'get', headers: {Cookie: cookie}});
    console.log(data);
    if (data.err_no) {
        await sendEmailFromQQ('今日掘金签到查询：失败', JSON.stringify(data));
    }
    return {error: data.err_no !== 0, isCheck: data.data}
}

// 抽奖
const draw = async () => {
    let {error, isDraw} = await getTodayDrawStatus();
    if (error) return console.log('查询抽奖次数失败');
    if (isDraw) return console.log('今日已无免费抽奖次数');
    const {cookie, baseUrl, apiUrl} = config;
    let {data} = await axios({url: baseUrl + apiUrl.drawLottery, method: 'post', headers: {Cookie: cookie}});
    if (data.err_no) return console.log('免费抽奖失败');
    console.log(`恭喜抽到：${data.data.lottery_name}`);
}

// 获取今天免费抽奖的次数
const getTodayDrawStatus = async () => {
    const {cookie, baseUrl, apiUrl} = config;
    let {data} = await axios({url: baseUrl + apiUrl.getLotteryConfig, method: 'get', headers: {Cookie: cookie}});
    if (data.err_no) {
        return {error: true, isDraw: false}
    } else {
        return {error: false, isDraw: data.data.free_count === 0}
    }
}

// 查询可以沾喜气的记录
const getGlobalBig = async () => {
    const {cookie, baseUrl, apiUrl} = config;
    let {data} = await axios({url: baseUrl + apiUrl.global_big, method: 'post', data: {page_no: 2, page_size: 5}, headers: {Cookie: cookie}});
    if (data.err_no) {
        return {error: true, history_id: null}
    } else {
        let temp = data.data.lotteries.filter(item => item.dip_lucky_user_count === 0)
        let lotteries = temp > 0 ? temp : data.data.lotteries
        return {error: false, history_id: lotteries[0].history_id}
    }
}

// 沾喜气
const dipLucky = async () => {
    let {error, history_id} = await getGlobalBig();
    if (error) return console.log('查询沾喜气的记录失败');
    if (!history_id) return console.log('无可沾喜气的记录');
    const {cookie, baseUrl, apiUrl} = config;
    let {data} = await axios({url: baseUrl + apiUrl.dip_lucky, method: 'post', data: {lottery_history_id: history_id}, headers: {Cookie: cookie}});
    if (data.err_no) return console.log('沾喜气失败');
    if (data.data.has_dip) return console.log('今天已经沾过了，明天再来吧');
    console.log(`恭喜沾到喜气：${data.data.dip_value}, 目前幸运值${data.data.total_value} / 6000`)
    await sendEmailFromQQ('沾喜气：成功', JSON.stringify(data));
}

/*---------------邮件-----------------*/

// 通过qq邮箱发送
const sendEmailFromQQ = async (subject, html) => {
    let cfg = config.email.qq;
    if (!cfg || !cfg.user || !cfg.pass) return;
    const transporter = nodeMailer.createTransport({service: 'qq', auth: {user: cfg.user, pass: cfg.pass}});
    transporter.sendMail({
        from: cfg.from,
        to: cfg.to,
        subject: subject,
        html: html
    }, (err) => {
        if (err) return console.log(`发送邮件失败：${err}`, true);
        console.log('发送邮件成功')
    })
}

// exports.juejin = async (event, context) => {
//     console.log('开始');
//     await checkIn();
//     await draw();
//     console.log('结束');
// };

const start = async () => {
    console.log('开始');
    await checkIn();
    await draw();
    await dipLucky();
    console.log('结束');
}

start()
