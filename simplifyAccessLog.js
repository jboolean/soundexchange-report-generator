const IcecastAccessLogParser = require('icecast-log-parser');
const fs = require('fs');
const { Transform } = require('stream');
const UAParser = require('./ua-parser-modified.js');
const moment = require('moment');

const extensions = {
  browser: [
    [/(AlexaMediaPlayer|Sonos)\/([\d\.]+)/], [UAParser.BROWSER.NAME, UAParser.VERSION]
  ]
};

const reportingStart = moment(process.argv[2]);
const reportingEnd = moment(process.argv[3]);

const toSimpleLogLine = new Transform({
  writableObjectMode: true,
  transform(chunk, encoding, callback) {
    const {
      ip,
      date: timestamp,
      status,
      duration,
      agent
    } = chunk;
    if (duration === 0) {
      callback();
      return;
    }
    if (ip === '173.66.31.49') {
      callback();
      return;
    }
    const timeMoment = moment(timestamp);
    if (timeMoment.isBefore(reportingStart) || timeMoment.isAfter(reportingEnd)) {
      callback();
      // console.log('Out of reporting window', timeMoment.format());
      return;
    }
    const dateString = timeMoment.format('YYYY-MM-DD');
    const timeString = timeMoment.format('HH:mm:ss');
    const ua = new UAParser(agent, extensions);
    let agentParts = [];
    const device = ua.getDevice();
    agentParts.push(device.vendor, device.model);
    const os = ua.getOS();
    agentParts.push(os.name);
    const browser = ua.getBrowser();
    agentParts.push(browser.vendor);
    agentParts.push(browser.name);
    agentParts = agentParts.filter((part) => !!part);
    const simpleAgent = agentParts.length ? agentParts.join(' ') : agent;
    // if (!agentParts.length) {
    //   console.log(agent);
    // }
    const rows = [ip, dateString, timeString, 'WOWD', duration, status, simpleAgent];
    this.push(rows.join('\t') + '\n');
    callback();
  }
})

// const source = fs.createReadStream('./access.log.20181202_212815');
const source = process.stdin;
// const dest = fs.createWriteStream('./report.tsv');
const dest = process.stdout;
const parser = new IcecastAccessLogParser();
dest.write('IP address	Date	Time	Stream	Duration	Status	Agent\n');
source.pipe(parser)
  .on('entry', (entry) => { toSimpleLogLine.write(entry); })
  .on('error', (err) => {
      // console.error(err);
      parser.resume();
    })
  .on('finish', () => { toSimpleLogLine.end(); });
toSimpleLogLine.pipe(dest);
