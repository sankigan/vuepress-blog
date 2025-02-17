#!/usr/bin/env sh

# 确保脚本抛出遇到的错误
set -e

git add .
git commit -m 'update'
git push -f git@github.com:sankigan/vuepress-blog.git main

# 生成静态文件
npm run build

# 进入生成的文件夹
cd .vuepress/dist

# 如果是发布到自定义域名
# echo 'www.example.com' > CNAME

git init
git add -A
git checkout -b master
git commit -m 'deploy'

# 如果发布到 https://<USERNAME>.github.io  USERNAME=你的用户名
git push -f git@github.com:sankigan/sankigan.github.io.git master

# 如果发布到 https://<USERNAME>.github.io/<REPO>  REPO=github上的项目
# git push -f git@github.com:<USERNAME>/<REPO>.git master:gh-pages

cd -
