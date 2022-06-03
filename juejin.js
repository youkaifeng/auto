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
        "drawLottery": "/growth_api/v1/lottery/draw"
    },
    "cookie": 'odin_tt=7e784287105002a00909570f61b5c5fbb507eb2b0cbf9b268a6bf234c9823f8c1d4633ed57ba92d004b1ba88da5d006d9741d5032234d74980d09df75cc1c3c4; _ga=GA1.2.192663843.1627397013; __tea_cookie_tokens_2608=%257B%2522web_id%2522%253A%25226911566539583047176%2522%252C%2522ssid%2522%253A%252260f809a5-b00b-4379-ac63-13fee9ee999a%2522%252C%2522user_unique_id%2522%253A%25226911566539583047176%2522%252C%2522timestamp%2522%253A1609224488151%257D; _tea_utm_cache_2608={%22utm_source%22:%22gold_browser_extension%22}; MONITOR_WEB_ID=afdfca2c-cdc1-43dc-a0bd-49230fb8c922; passport_csrf_token=ebe1cd59a8867ab94ac19c67de1912b8; passport_csrf_token_default=ebe1cd59a8867ab94ac19c67de1912b8; _tea_utm_cache_2018={%22utm_source%22:%22gold_browser_extension%22}; n_mh=gZ_vTouAqsc1bJFD9ktl9JW9eyLqDKxOFoR-na8y_8M; sid_guard=63cc11799cf7837122c085fd9a878686%7C1651383579%7C31536000%7CMon%2C+01-May-2023+05%3A39%3A39+GMT; uid_tt=3beaf11a4c4bf29f6c19bbe77bfc0ef3; uid_tt_ss=3beaf11a4c4bf29f6c19bbe77bfc0ef3; sid_tt=63cc11799cf7837122c085fd9a878686; sessionid=63cc11799cf7837122c085fd9a878686; sessionid_ss=63cc11799cf7837122c085fd9a878686; sid_ucp_v1=1.0.0-KDQ3YmM4N2JiM2Y2NjZjOWNhYTA3Y2JhMDViYTA3N2JhNmQwOGEwZjQKFwjH4MD8to3kBxCburiTBhiwFDgCQO8HGgJsZiIgNjNjYzExNzk5Y2Y3ODM3MTIyYzA4NWZkOWE4Nzg2ODY; ssid_ucp_v1=1.0.0-KDQ3YmM4N2JiM2Y2NjZjOWNhYTA3Y2JhMDViYTA3N2JhNmQwOGEwZjQKFwjH4MD8to3kBxCburiTBhiwFDgCQO8HGgJsZiIgNjNjYzExNzk5Y2Y3ODM3MTIyYzA4NWZkOWE4Nzg2ODY',
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

exports.juejin = async (event, context) => {
    console.log('开始');
    await checkIn();
    await draw();
    console.log('结束');
};