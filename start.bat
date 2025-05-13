@echo off
setlocal enableDelayedExpansion

set /p browserChoice="Firefox (any) or Chromium (c)? "

set "TEMP_FOLDER=%~dp0chromiumTemp"

if /i "%browserChoice%"=="c" (

    if exist "!TEMP_FOLDER!" rd /s /q "!TEMP_FOLDER!"
    mkdir "!TEMP_FOLDER!"
 
    attrib +h "!TEMP_FOLDER!"

    xcopy /e /i /y "firefox\*" "!TEMP_FOLDER!" >nul
    xcopy /e /i /y "chromium\*" "!TEMP_FOLDER!" >nul
)

set /p runAndroid="Do you want to run as Android? (y/any): "

if /i "%browserChoice%"=="c" (
    if /i "%runAndroid%"=="y" (
        web-ext run --target=chromium --source-dir=chromiumTemp --args="--user-agent='Mozilla/5.0 (Android 13; Mobile; rv:120.0) Gecko/120.0 Firefox/120.0'"
    ) else (
        web-ext run --target=chromium --source-dir=chromiumTemp
    )
) else (
    if /i "%runAndroid%"=="y" (
        web-ext run --source-dir=firefox --pref "general.useragent.override=Mozilla/5.0 (Android 13; Mobile; rv:120.0) Gecko/120.0 Firefox/120.0"
    ) else (
        web-ext run --source-dir=firefox
    )
)

pause
