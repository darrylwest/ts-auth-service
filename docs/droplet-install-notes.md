# Droplet PM2 Install Notes

## Configure Services folder

```
sudo mkdir -p /usr/local/services/
sudo chown dpw /usr/local/services/

cd /usr/local/services
git clone git@github.com:darrylwest/ts-auth-service.git firebase-auth
cd firebase-auth
export DOTENV_PRIVATE_KEY=<value-from-env.keys>
npm i
npm run build

pm2 start ./dist/index.js --name "firebase-auth"

pm2 list
./scripts/ping.sh
```

* create the services folder (if it doen't exist)
* clone from github to firebase-auth
* build then remove the source
* add DOTENV_PRIVATE_KEY=<value-from-env.keys>

###### dpw | 2025.08.06


