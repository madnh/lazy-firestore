const glob = require('glob');
const path = require('path');

function cleanFileName(fileName) {
  return fileName.replace(/^\d+\./, '');
}


/**
 * @param {string} dir 
 */
module.exports.scanFolders = async function scanFolders(dir) {
  return new Promise((res, rej) => {
    const options = {
      cwd: dir
    };

    glob('*/', options, (err, files) => {
      if (err) {
        rej(err);
        return;
      }

      res(
        files.filter(file => file.endsWith('/'))
          .map(folder => folder.replace(/\/$/g, ''))
      );
    });
  })
};


module.exports.scanFiles = async function scanFiles(dir, extension) {
  if (typeof extension !== 'string' || !extension) {
    throw new Error('extension parameter is required and must be string');
  }

  return new Promise((res, rej) => {
    const options = {
      cwd: dir,
      nodir: true
    };
    const pattern = `*.${extension}`;

    glob(pattern, options, (err, files) => {
      if (err) {
        rej(err);
        return;
      }

      res(
        files.filter(file => !file.endsWith('/'))
          .map(file => {
            const ext = path.extname(file);
            const fileName = path.basename(file, ext);

            return {
              file,
              fileName: fileName,
              ext,
              isJsFile: /\.js$/.test(ext),
              cleanName: cleanFileName(fileName)
            };
          })
      );
    });
  })
}