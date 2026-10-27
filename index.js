'use strict';

// npm install --os=linux --cpu=x64 aws-sdk
// npm install --os=linux --cpu=x64 sharp

const querystring = require('querystring'); // 설치하지 않아도 됨
const AWS = require('aws-sdk'); // 설치 해야함
const Sharp = require('sharp'); // 설치 해야함
const isImage = require('./is-image');

const S3 = new AWS.S3({
    region: 'ap-northeast-2'
});
const BUCKET = 'team-kap-koin-storage';

const MB = 1024 * 1024;

exports.handler = async (event, context, callback) => {
    const { request, response } = event.Records[0].cf;
    console.log(response.headers);
    console.log(response.body);

    // 파라미터들은 w, h, f, q 이고 width, height, format, quality를 나타낸다.
    const params = querystring.parse(request.querystring);

    // 이미지 이름과 확장자를 추출.
    const { uri } = request;
    const [, imageName, extension] = uri.match(/\/?(.*)\.(.*)/);

    // uri가 이미지가 아닐경우 원본 요청 반환
    if (!isImage(uri)) {
        return callback(null, response);
    }

    // 사이즈 초기화
    let width = parseInt(params.w, 10) || null;
    let height = parseInt(params.h, 10) || null;

    // 이미지 퀄리티 초기화
    // Sharp는 이미지 포맷에 따라서 품질(quality)의 기본값이 다릅니다.
    let quality = parseInt(params.q, 10) || null;

    // 확장자 초기화.
    // 기본값: webp
    let format = params.f ? params.f : "webp"; 

    // AWS CloudWatch에서 로그 확인용
    console.log(`parmas: ${JSON.stringify(params)}`); // Cannot convert object to primitive value.
    console.log(`name: ${imageName}.${extension}`); // Favicon error, if name is `favicon.ico`.

    // s3에서 이미지 객체 가져오기
    let s3Object;
    try {
        s3Object = await S3.getObject({
            Bucket: BUCKET,
            Key: decodeURI(imageName + '.' + extension)
        }).promise();
    } catch (error) {
        // 이미지가 없는 경우 원본 요청 반환
        if (error.code === 'NoSuchKey') {
            console.log('Image not found in S3. Returning original response.');
            return callback(null, response);
        }
        console.log('S3.getObject: ', error);
        return callback(error);
    }

    // 이미지 리사이즈 시작
    // 포맷 & 퀄리티 변경
    let resizedImage;
    try {
        resizedImage = await Sharp(s3Object.Body)
            .rotate()
            .resize(width, height, {
                fit: 'inside',
                withoutEnlargement: true
            })
            .toFormat(format, { quality })
            .toBuffer();
    } catch (error) {
        console.log('Sharp: ', error);
        return callback(error);
    }
    
    const resizedImageByteLength = Buffer.byteLength(resizedImage, 'base64');
    console.log('byteLength: ', resizedImageByteLength);

    // TODO 이미지가 1 MB보다 크면 리사이즈하여 반환해야 한다.
    // 이미지가 1 MB보다 크면 원본을 반환한다.
    if (resizedImageByteLength > 1 * MB) {
        return callback(null, response);
    }

    response.status = 200;
    response.body = resizedImage.toString('base64');
    response.bodyEncoding = 'base64';
    response.headers['content-type'] = [
        { 
            key: 'Content-Type',
            value: `image/${format}`
        }
    ];
    return callback(null, response);
};
