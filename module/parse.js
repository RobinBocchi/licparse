'use strict';
const fs = require('fs');
const path = require('path');
const { parse } = require('json2csv');
const os = require('os');
const shell = require('shelljs');

let findLicenseDirSync = function(path) {
  let pa = fs.readdirSync(path);
  let array = [];
  pa.forEach(function(ele, index) {
    let fullPath = path + '/' + ele;
    let info = fs.statSync(fullPath);
    if (info.isDirectory()) {
      array.push(path + '/' + ele);
    } else {
      console.log('异常文件: ' + path + '/' + ele);
    }
  });
  return array;
};

let findLicenseFileSync = function(path) {
  //console.log('查找License:' + path);
  let pa = fs.readdirSync(path);
  let licensePath = [];
  pa.forEach(function(ele, index) {
    let fullPath = path + '/' + ele;
    let info = fs.statSync(fullPath);
    if (info.isFile() && ele.toLowerCase().indexOf('license') != -1) {
      //console.log(('找到License:' + fullPath).green);
      licensePath.push(fullPath);
    }
  });
  return licensePath;
};
let readLicense = function(pathArray) {
  let all = '';
  pathArray.forEach(path => {
    let stat = fs.statSync(path);
    if (stat && stat.isFile()) {
      let content = fs.readFileSync(path);
      all += content;
    }
  });
  return all;
};
let typeJudge = function(licenseContent) {
  let type = '未知';
  if (licenseContent.indexOf('MIT') != -1) {
    type = 'MIT';
  } else if (licenseContent.indexOf('Apache License') != -1) {
    type = 'Apache License';
  } else if (licenseContent.indexOf('BSD') != -1) {
    type = 'BSD License';
  } else if (licenseContent.indexOf('GPL') != -1) {
    type = 'GPL';
  } else if (licenseContent.indexOf('LGPL') != -1) {
    type = 'LGPL';
  } else if (licenseContent.indexOf('Mozilla') != -1) {
    type = 'MPL';
  } else if (licenseContent.indexOf('Eclipse') != -1) {
    type = 'EPL';
  } else if (licenseContent.indexOf('MPL') != -1) {
    type = 'MPL';
  } else if (licenseContent.indexOf('Creative Commons') != -1) {
    type = 'Creative Commons (CC) 许可协议';
  }
  return type;
};

module.exports = dir => {
  console.log('开始解析目录：' + dir);

  let libPathArray = [];

  // bower part
  try {
    let bowerDir = dir + '/bower_components';
    let infoBower = fs.statSync(bowerDir);
    if (infoBower && infoBower.isDirectory()) {
      console.log('存在bower文件夹, 开始检查...'.green);
      let bowerArray = findLicenseDirSync(bowerDir);
      bowerArray.forEach(path => {
        libPathArray.push(path);
      });
      console.log(bowerArray.length + '个文件');
    } else {
      console.log('不存在bower文件夹，只检查npm库'.red);
    }
  } catch (error) {
    console.log('没有bower目录'.gray);
  }

  // npm part
  try {
    let npmDir = dir + '/node_modules';
    let infoNpm = fs.statSync(npmDir);
    if (infoNpm && infoNpm.isDirectory()) {
      console.log('存在npm文件夹, 开始检查...'.green);
      let npmArray = findLicenseDirSync(npmDir);
      npmArray.forEach(path => {
        libPathArray.push(path);
      });
      console.log(npmArray.length + '个文件');
    } else {
      console.log('不存在npm文件夹，只检查npm库'.red);
    }
  } catch (error) {
    console.log('没有bower目录'.gray);
  }
  if (libPathArray.length == 0) {
    console.log('没有bower目录'.red);
    return;
  }

  let resultArray = [];
  let countObject = {}; // 用于计数
  libPathArray.forEach(path => {
    let lib = {};
    lib.path = path;
    let pathSplitArray = path.split('/');
    lib.name = pathSplitArray[pathSplitArray.length - 1];
    let licensePathArray = findLicenseFileSync(path);

    if (licensePathArray.length > 0) {
      lib.licensePath = JSON.stringify(licensePathArray);
      lib.licenseCount = licensePathArray.length;
      let content = readLicense(licensePathArray);
      lib.content = content;
      lib.type = typeJudge(content);
    } else {
      lib.licenseCount = 0;
      lib.licensePath = '无License文件';
      lib.content = '无License文件';
      lib.type = '无License文件';
    }
    resultArray.push(lib);
    if (countObject.hasOwnProperty(lib.type)) {
      let count = countObject[lib.type];
      count += 1;
      countObject[lib.type] = count;
    } else {
      countObject[lib.type] = 1;
    }
  });
  console.log('----------------');
  Object.keys(countObject).forEach(function(index) {
    console.log('License为' + index + '的库个数为：', countObject[index]);
  });
  console.log('----------------');
  const fields = [
    'name',
    'path',
    'licenseCount',
    'licensePath',
    'content',
    'type'
  ];
  const opts = { fields };
  const result = resultArray;
  const csv = parse(result, opts);
  let userRootPath = os.homedir();
  if (fs.existsSync(userRootPath + '/licenseParse.csv')) {
    fs.unlink(userRootPath + '/licenseParse.csv', function(err) {
      if (err) {
        console.log(err);
      } else {
        console.log('旧文件删除成功');
      }
    });
  }
  fs.writeFile(userRootPath + '/licenseParse.csv', csv, function(err) {
    if (err) throw err;
    console.log('licenseParse.csv file saved at ~/');
    shell.exec('open ~/licenseParse.csv');
  });
};
