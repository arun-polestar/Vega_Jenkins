// 'use strict';
// const request = require('request');
// const axios = require('axios');
// const FormData = require('form-data');
// const fetch = require("node-fetch");

// const config = require('./../../config/config');
// const { clientId, clientSecret, redirectURI}=require('./../../config/config').linkedin;
// // const redirectURI = require('./../../config/config').redirectURI;
// const   authorizationURL= 'https://www.linkedin.com/oauth/v2/authorization',
//     accessTokenURL= 'https://www.linkedin.com/oauth/v2/accessToken',
//     // redirectURI = 'https://polestarllp.vega-hr.com',
//     sessionName= '',
//     sessionKeys= ['', '']  ;

// module.exports = {
//     getAuthorizationUrl,
//     getAccessToken,
//     getLinkedinId,
//     publishContent,
//     linkedintoken,
//     postcertificate,

// }

// function getAuthorizationUrl(req,res) {
//     try{
//         if ( !req.body.stage || !req.body.text  || !req.body.thumb){
//         return res.json({state:1,message:"send Required data"});
//                }

//      global.stage= req.body.stage;
//      global.text= req.body.text;
//      global.title= req.body.title|| '';
//      global.url= req.body.url;
//      global.thumb = req.body.thumb;
//         global.fileName = req.body.fileName;

//         const state = Buffer.from(Math.round(Math.random() * Date.now()).toString()).toString('hex');
//     const scope = encodeURIComponent('r_liteprofile r_emailaddress w_member_social');
//     const linkedinurl = `${authorizationURL}?response_type=code&client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectURI)}&state=${state}&scope=${scope}`;
//         return res.json({ state: 1, message: "Succcess", URL: linkedinurl ||''})
//     } catch (e) {
//         return res.json({ state: -1, data: null, message: e.message || e });
//     }
// }

// function getAccessToken(req) {
//     const { code } = req.query;
//     const body = {
//         grant_type: 'authorization_code',
//         code,
//         redirect_uri: redirectURI,
//         client_id: clientId,
//         client_secret: clientSecret
//     };
//     return new Promise((resolve, reject) => {
//         request.post({ url: accessTokenURL, form: body }, (err, response, body) => {
//             if (err) {
//                 reject(err);
//             }
//             resolve(JSON.parse(body));
//         }
//         );
//     });
// }

// async function getLinkedinId(req) {
//     let authKey = req.body && req.body.authKey;
//     console.log("authKey", authKey);
//     return new Promise(async (resolve, reject) => {
//         const url = 'https://api.linkedin.com/v2/me';
//         const headers = {
//             'Authorization': `Bearer ${ authKey}`
//         };
//         try{
//              let response= await axios.get(url, {headers} )
//             resolve(response && response.data && response.data.id || 0);
//         }
//         catch(err){
//             reject(err.message|| err);
//         }
//     });
// }

// async function publishContent(req, linkedinId, content,token) {
//     const url = 'https://api.linkedin.com/v2/shares';
//     const { title, text, shareUrl, shareThumbnailUrl } = content;
//     const body = {
//         owner: 'urn:li:person:' + linkedinId,
//         subject: title,
//         text: {
//             text: text ||"Testing to share on linkedin"
//         },
//         content: {
//             contentEntities: [{
//                 entityLocation: config.webUrlLink + '/webapi/' + shareUrl,
//                 thumbnails: [{
//                     resolvedUrl: config.webUrlLink + '/webapi/' +shareThumbnailUrl
//                 }]
//             }],
//             title: title
//         },
//         distribution: {
//             linkedInDistributionTarget: {}
//         }
//     };
//     const headers = {
//         'Authorization': 'Bearer ' +token,
//         'cache-control': 'no-cache',
//         'X-Restli-Protocol-Version': '2.0.0',
//         'x-li-format': 'json'
//     };
//     return new Promise((resolve, reject) => {
//         request.post({ url, json: body, headers }, (err, response, body) => {
//             if (err || body && body.message) {
//                 console.log('ERRR', err)
//                 return reject(err || body.message);
//             }else{
//              console.log('bodyy-->', body);
//             return resolve(body);
//             }
//         });
//     });

// }

// async function linkedintoken(req, res) {
//     var stage = `${config && config.webUrlLink}/#/${global.stage}`;
//    try{
//     const data = await  getAccessToken(req);
//        req.body.authKey = data && data.access_token;
//        const id = await  getLinkedinId(req);
//        const token = data && data.access_token;
//        console.log("Params  are--------------->",req.query);
//        const content = {
//            title: global.title,
//            text: global.text,
//            shareUrl: global.url,
//            shareThumbnailUrl:global.thumb
//        };
//        console.log('content is ----------------->>', 'id', id, 'token', token );
//     //    const ret_post = await postcertificate(global.url, token, id);
//     //    console.log("ret_post", ret_post);
//     //    const response = await publishContent(req, id, content, token);
//     //    console.log("Successfully post share on linkedin ", response);
//        let imageurl = config.webUrlLink + '/webapi/' + global.thumb;
//        axios.get(imageurl, { responseType: 'arraybuffer' }).then((imageData) => {
//            const contentType = imageData.headers['content-type'];
//            let linkedinId = id; //'CS8VX8fmhZ';
//         //    let token = 'AQXXGlloC-nrJoylgGI2VsDyY8dEggZMUtTe3JjGqHXQrNJtXSLEnQWbB8n6fNXI3avxtLKzQ530BxH0KEkYbb8_ZPv2jS5XO6HsEy8Eg9PoBxcyPo-y3MYmo-r16I73hV4wlp9KpSxFguhlasq7pXzidMCzCQRgqQPT57BtAoH7WX07zz50Xd5mnrNq0twxgJq1nL_VjVmZm_mhW160GpAm2vUKLe7ZaV-H30lgqmZxmHhwm6ry0jIeXDvQfimbURx4SjF0A0GHJRZcSNfrgdFX2R3rEaQBfBHpJex7kgMD37_qhEDCi_9SRtHDNIG4F00-HK7Sj_1DhT4TIA9Bbs_OsamaUQ';
//            const registerUploadRequest = {
//                owner: 'urn:li:person:' + linkedinId,
//                recipes: ['urn:li:digitalmediaRecipe:feedshare-image'],
//                serviceRelationships: [
//                    {
//                        identifier: 'urn:li:userGeneratedContent',
//                        relationshipType: 'OWNER',
//                    },
//                ],
//                supportedUploadMechanism: ['SYNCHRONOUS_UPLOAD'],
//            };
//            const headers = {
//                'Authorization': `Bearer ${token}`
//            };
//            axios.post('https://api.linkedin.com/v2/assets?action=registerUpload', { registerUploadRequest }, { headers }).then((result) => {
//                const url = result.data.value.uploadMechanism['com.linkedin.digitalmedia.uploading.MediaUploadHttpRequest'].uploadUrl,
//                    assetId = result.data.value.asset.replace('urn:li:digitalmediaAsset:', '');
//                let obj={
//                     asset:imageData.data,
//                     description:"Image share testing with Linkedin",
//                     authKey:token,
//                     personUri: linkedinId
//                }
//                  create_Post(JSON.stringify(obj)).then((rel1)=>{
//                      console.log('RELLLLLLLLL',rel1);
//                  }).catch(e=>{
//                         console.log('eeeeeeeeeeeeee',e);
//                  })
//             })
//        })
//        return res.send(`<!DOCTYPE html><html><head><script>window.open('${stage}?status="success"','_self');</script></head></html>`);
//    }
//    catch(e){
//        console.log('ERROR in linkedin share ',e.message||e)
//        return res.send(`<!DOCTYPE html><html><head><script>window.open('${stage}?status=${e.message || e}','_self');</script></head></html>`);
//    }

// }

// async function postcertificate(req,res)  {
//     let url = config.webUrlLink + '/webapi/' + req.body.thumb;
//     // let imageUrl = req.body.thumb;
//     try {
//         axios.get(url, { responseType: 'arraybuffer' }).then((imageData) => {
//             const contentType = imageData.headers['content-type'];
//             let linkedinId ='CS8VX8fmhZ';
//             let token = 'AQUA4tBEKD2W13c3mcGXcjRhC39Wr8yBKb27ZhBqsfXbZGIRMH8_oSYtY1NVRQZf4I_S0ceeH7K9YFv1s1pzc4V52wX3ntwDnXLxCHDRgoa7Z3xABZmv-e5s6lff1gwXF53SVqpr2PrRHfRGEZjS1O73bQWiGJno2QJkGBc_rCFx5H2vFotH4FGRlNluj4co7SYzLuZpqhOoZlpDShMrcW7gT-W3suLYpKpYb_V6toT0sBEETJEe6v86NmJ77i7kh4QvRy8zccfjZz1LBBa_pGmAOXP6WnfboZp_-Fj50wKN9A9w3ObK4KUMPX7Y0vGd-65bjjlh8iCOUsychRuBPkBV5f_c5w';
//             const registerUploadRequest = {
//                 owner: 'urn:li:person:'+linkedinId,
//                 recipes: ['urn:li:digitalmediaRecipe:feedshare-image'],
//                 serviceRelationships: [
//                     {
//                         identifier: 'urn:li:userGeneratedContent',
//                         relationshipType: 'OWNER',
//                     },
//                 ],
//                 supportedUploadMechanism: ['SYNCHRONOUS_UPLOAD'],
//             };
//             const headers = {
//                 'Authorization': `Bearer ${token}`
//             };
//             axios.post('https://api.linkedin.com/v2/assets?action=registerUpload',{registerUploadRequest}, {headers }).then((result) => {
//                 const url1 = result.data.value.uploadMechanism['com.linkedin.digitalmedia.uploading.MediaUploadHttpRequest'].uploadUrl,
//                 assetId = result.data.value.asset.replace('urn:li:digitalmediaAsset:', '');
//                 console.log('url', url1, "assetId", assetId);
//                 let ass ='C4E22AQG2JWIRko_6ww';
//              axios.post(url1, imageData.data, {
//                 headers: {
//                      'Authorization': `Bearer ${token}`,
//                     'Content-Type': contentType,
//                 },
//             }).then((anuj)=>{

//                 let obj = {
//                     asset: assetId,
//                     description: "Image share testing with Linkedin",
//                     authKey: token,
//                     personUri: linkedinId
//                 }
//                 create_Post(JSON.stringify(obj)).then((rel1) => {
//                     console.log('RELLLLLLLLL', rel1);
//                 }).catch(e => {
//                     console.log('eeeeeeeeeeeeee', e);
//                 })
//                 console.log('RESUSSSSSSSSSSSSSSSSSSSSS',anuj);
//             })
//         })

//             return res.json({ state: 1, message: "SUCCESS" });

//         })

//     } catch (err) {
//         // console.error('error',err);
//         return res.json({ state: -1, message: "ERROR" });

//     }
// };

// async function create_Post(upload) {
// new Promise((resolve,reject)=>{
//     const asset = upload.asset;
//     const description = upload.description;
//     const authKey = upload.authKey;
//     const personUri = upload.personUri;

// return fetch('https://api.linkedin.com/v2/ugcPosts', {
//     method: 'POST',
//     headers: {
//         'Authorization': `Bearer ${authKey}`,
//         'Content-Type': 'application/json'
//     },
//     body: JSON.stringify({
//         "author": `urn:li:person:${personUri}`,
//         "lifecycleState": "PUBLISHED",
//         "specificContent": {
//             "com.linkedin.ugc.ShareContent": {
//                 "shareCommentary": {
//                     "text":"For the origin story of Truths and Insights"
//                 },
//                 "shareMediaCategory": "IMAGE",
//                 "media": [{
//                     "status": "READY",
//                     "description": {
//                         "text": "LinkedIn API v2 Testing share"
//                     },
//                     "media": `urn:li:digitalmediaAsset:${asset}`,
//                     "title": {
//                         "text": "LinkedIn API v2 Testing share"
//                     }
//                 }]
//             }
//         },
//         "visibility": {
//             "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC"
//         }
//     })
// }).then(response => {
//     console.log("respons", response.json());
//     resolve(response.json())
//     })
//     .then(responseId => {
//         console.log("responseId", responseId);
//         resolve(responseId)})
//     .catch(er => {console.log('EEEEEEEEEEEE',er)
//     reject(err)});
// })
// }
