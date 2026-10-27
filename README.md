# Image Resize

CloudFront 응답 이벤트에서 S3 이미지를 가져와 요청한 크기와 형식으로 변환하는 Lambda@Edge 함수입니다. 이미지 처리는 [Sharp](https://sharp.pixelplumbing.com/)를 사용합니다.

## 동작

- 요청 URI에서 이미지 경로를 추출해 S3 객체를 가져옵니다.
- 이미지 방향을 보정하고 지정한 크기 안에 들어가도록 축소합니다. 원본보다 크게 확대하지 않습니다.
- 변환한 이미지를 Base64로 인코딩해 응답합니다. 변환 결과가 1 MiB를 초과하거나 S3에 객체가 없으면 기존 CloudFront 응답을 반환합니다.
- 확장자가 있는 이미지가 아닌 요청은 기존 응답을 반환합니다.

## 요청 방법

| 쿼리 파라미터 | 설명 | 기본값 |
| --- | --- | --- |
| `w` | 최대 너비 | 지정하지 않음 |
| `h` | 최대 높이 | 지정하지 않음 |
| `f` | Sharp가 지원하는 출력 형식 | `webp` |
| `q` | 출력 품질 | 지정하지 않음 |

예를 들어 `/images/photo.jpg?w=640&h=480&f=webp&q=80`으로 요청할 수 있습니다.

## 설치 및 배포 패키지 생성

Node.js와 npm, `zip`이 필요합니다. 현재 잠금 파일의 Sharp 0.33.5는 Node.js `^18.17.0 || ^20.3.0 || >=21.0.0`을 요구합니다.

현재 핸들러는 `callback`을 사용합니다. Lambda@Edge의 Node.js 24 런타임에서는 콜백 기반 핸들러를 지원하지 않으므로, 24로 올리기 전에 핸들러를 `async` 반환 방식으로 수정해야 합니다. Node.js 22는 이 제한이 없지만, 런타임의 [지원 종료 일정](https://docs.aws.amazon.com/lambda/latest/dg/lambda-runtimes.html)을 확인하세요. 자세한 내용은 [AWS의 Node.js 24 런타임 안내](https://aws.amazon.com/blogs/compute/node-js-24-runtime-now-available-in-aws-lambda/)를 참고하세요.

스크립트는 Linux x64용 `aws-sdk`와 `sharp`를 설치한 후 배포 패키지를 생성합니다. 설치 과정에서 `package.json`과 `package-lock.json`이 변경될 수 있습니다.

```bash
./package.sh
```

`image-resize.zip`이 생성됩니다. 스크립트는 현재 디렉터리를 재귀적으로 압축하며 `package.sh`, 기존 `image-resize.zip`, `README.md`, `.gitignore`, `.gitignore.txt`, `.git`을 제외합니다. 그 외 숨김 파일은 압축 대상입니다.

## Lambda@Edge 리전 제한

Lambda@Edge 함수는 미국 동부(버지니아 북부, `us-east-1`) 리전에서만 생성·수정할 수 있으며, 다른 리전을 선택할 수 없습니다. ([AWS 문서](https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/lambda-edge-how-it-works.html))

## 설정

- 함수 핸들러: `index.handler`
- S3 리전: `ap-northeast-2`
- S3 버킷: `team-kap-koin-storage`

S3 리전과 버킷은 [index.js](index.js)에 지정되어 있습니다. 다른 환경에서는 해당 값을 수정하고 함수에 S3 객체 읽기 권한을 부여해야 합니다.
