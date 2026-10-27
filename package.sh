#!/bin/bash
set -e

# 임시 zip 파일 이름 설정
TEMP_ZIP="temp_image-resize.zip"

echo "의존성을 설치합니다..."
npm install --os=linux --cpu=x64 aws-sdk
npm install --os=linux --cpu=x64 sharp

# 압축 중 메시지 출력
echo "압축중..." 

# 현재 디렉토리의 파일을 압축하되, 스크립트와 배포에 불필요한 파일은 제외
# 출력을 /dev/null로 리다이렉트하여 숨김
zip -r "$TEMP_ZIP" . -x "package.sh" "image-resize.zip" \
    "README.md" "*/README.md" \
    ".gitignore" "*/.gitignore" \
    ".gitignore.txt" "*/.gitignore.txt" \
    ".git" ".git/*" "*/.git" "*/.git/*" > /dev/null 2>&1

# 기존 image-resize.zip 파일이 있다면 삭제
if [ -f "image-resize.zip" ]; then
    rm "image-resize.zip"
fi

# 임시 zip 파일의 이름을 image-resize.zip으로 변경
mv "$TEMP_ZIP" "image-resize.zip"

echo "압축이 완료되었습니다. image-resize.zip 파일이 생성되었습니다."
