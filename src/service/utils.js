function inTwo(array, inarray) {
  return inarray.find(item => array.indexOf(item) !== -1);
}

function _log(text) {
  console.log(text);
}
function escapeHtml(text) {
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    '\'': '&#039;',
  };

  return text.replace(/[&<>"']/g, m => map[m]);
}

const transliterate = function (text) {
  let rus = 'щ   ш  ч  ц  ю  я  ё  ж  ъ  ы  э  а б в г д е з и й к л м н о п р с т у ф х ь'.split(
    / +/g),
    eng = 'shh sh ch cz yu ya yo zh \' y\' e` a b v g d e z i j k l m n o p r s t u f x \''.split(
      / +/g);
  if (text) {
    text = text.toLowerCase();
    for (let x = 0; x < rus.length; x += 1) {
      text = text.split(rus[x])
        .join(eng[x]);
      text = text.split(rus[x])
        .join(eng[x]);
    }

    text = text.replace(/\s+| /g, '-');
    text = text.replace(/[^a-z-]/g, '');
    text = text.replace(/-+/g, '-');
    return text;
  }
  return '';
};

function getStringValue(value, key) {
  if (Array.isArray(value) && value[0]) {
    return value[0];
  }
  if (typeof value === 'object') {
    return deepSearch(value, key);
  }
  return value;
}

function deepSearch(obj, key) {
  let found = '';

  if (obj) {
    Object.keys(obj)
      .find((item) => {
        if (item === key) {
          found = getStringValue(obj[item]);
          if (typeof found === 'object') {
            found = deepSearch(obj[item], key);
          } else {
            return true;
          }
        } else if (typeof obj[item] === 'object') {
          found = deepSearch(obj[item], key);
          if (found) {
            return true;
          }
        }
      });
  }
  return found;
}

function basename(str = '', noExt = false) {
  let base = str.toString()
    .substring(str.lastIndexOf('/') + 1);
  if (!noExt) {
    const ext = /\.png/.test(str) ? 'png' : 'jpg';
    base = base.replace(new RegExp(`.${ext}(.*?)+$`), `.${ext}`);
  } else {
    if (base.lastIndexOf('.') !== -1) {
      base = base.substring(0, base.lastIndexOf('.'));
    }
  }

  return base;
}

function basenameFile(s, withDir) {
  const b = basename(s);
  const ext = /\.png/.test(s) ? 'png' : 'jpg';
  const dir = `${b[0]}${b[1]}${b[2]}`;
  const file = `${dir}/${b}.${ext}`;
  if (withDir) {
    return {
      dir,
      file,
    };
  }

  return file;
}

function showMem() {
  if (!this.os) {
    this.os = require('os');
  }
  _log(memLog(this.os.freemem()));
  _log(memLog(this.os.totalmem()));
  const used = process.memoryUsage().heapUsed;
  _log(`used ${memLog(used)}`);
}

function usedMem(event) {
  const used = process.memoryUsage().heapUsed;
  _log(`${event ? `${event} use ` : ''}${memLog(used)}`);
}

function checkItem(model, search, many = false) {
  if (many) {
    return model.find(search);
  }
  return model.findOne(search);
}

function memLog(d) {
  d = d / 1024 / 1024;
  return `${Math.round(d * 100) / 100}MB`;
}

const asyncForEach = async (array, callback) => {
  for (let index = 0; index < array.length; index += 1) {
    await callback(array[index], index, array);
  }
};
const asyncForEachObject = async (obj, callback) => {
  for (const i in obj) {
    if (obj.hasOwnProperty(i)) {
      await callback(obj[i], i, obj);
    }
  }
};
const getExistsContainer = async (model, items, uniqField, objsLimit = 1000) => {
  const objectIds = [];
  let item = {};
  const existsContainer = {};
  for (let i = 0; i < items.length; i += 1) {
    item = items[i];
    objectIds.push(item[uniqField][0]);
  }

  while (objectIds.length) {
    const checkObjects = objectIds.splice(0, objsLimit);
    if (checkObjects.length) {
      const search = {};
      search[uniqField] = { $in: checkObjects };
      const exists = await Utils.checkItem(model, search, true);

      for (let i = 0; i < exists.length; i += 1) {
        const cr = exists[i].transform();
        const field = cr[uniqField];
        existsContainer[field] = cr._id;
      }
    }
  }
};
const Utils = function () {
  return {
    inTwo,
    escapeHtml,
    transliterate,
    getStringValue,
    deepSearch,
    basename,
    basenameFile,
    showMem,
    usedMem,
    asyncForEach,
    asyncForEachObject,
    checkItem,
    getExistsContainer,
  };
};

module.exports = Utils();
