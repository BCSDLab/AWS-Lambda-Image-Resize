#!/bin/bash

# 임시 zip 파일 이름 설정
TEMP_ZIP="temp_image-resize.zip"

# 압축 중 메시지 출력
echo "압축중..." 

# 현재 디렉토리의 모든 파일을 압축하되, zip.sh와 image-resize.zip은 제외
# 출력을 /dev/null로 리다이렉트하여 숨김
zip -r "$TEMP_ZIP" . -x "zip.sh" "image-resize.zip" > /dev/null 2>&1

# 기존 image-resize.zip 파일이 있다면 삭제
if [ -f "image-resize.zip" ]; then
    rm "image-resize.zip"
fi

# 임시 zip 파일의 이름을 image-resize.zip으로 변경
mv "$TEMP_ZIP" "image-resize.zip"

echo "압축이 완료되었습니다. image-resize.zip 파일이 생성되었습니다."
