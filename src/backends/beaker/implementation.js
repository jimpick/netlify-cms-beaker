import semaphore from "semaphore";
import AuthenticationPage from './AuthenticationPage';
import { fileExtension } from '../../lib/pathHelper';

const MAX_CONCURRENT_DOWNLOADS = 10;

const origin = document.location.origin;
const archive = new DatArchive(document.location.origin);

window.repoFiles = window.repoFiles || {};

function getFile(path) {
  const segments = path.split('/');
  let obj = window.repoFiles;
  while (obj && segments.length) {
    obj = obj[segments.shift()];
  }
  return obj || {};
}

function nameFromEmail(email) {
  return email
    .split('@').shift().replace(/[.-_]/g, ' ')
    .split(' ')
    .filter(f => f)
    .map(s => s.substr(0, 1).toUpperCase() + (s.substr(1) || ''))
    .join(' ');
}

export default class TestRepo {
  constructor(config) {
    this.config = config;
  }

  setUser() {}

  authComponent() {
    return AuthenticationPage;
  }

  authenticate(state) {
    return Promise.resolve({ email: state.email, name: nameFromEmail(state.email) });
  }

  logout() {
    return null;
  }

  getToken() {
    return Promise.resolve('');
  }

  entriesByFolder(collection, extension) {
    const entries = [];
    const folder = collection.get('folder');
    const promise = archive.readdir(folder)
      .then(files => files.filter(file => fileExtension(file) === extension))
      .then(this.fetchFiles(folder));
    return promise
  }

  entriesByFiles(collection) {
    const files = collection.get('files').map(collectionFile => ({
      path: collectionFile.get('file'),
      label: collectionFile.get('label'),
    }));
    return Promise.all(files.map(file => ({
      file,
      data: getFile(file.path).content,
    })));
  }

  fetchFiles = (folder) => (files) => {
    const sem = semaphore(MAX_CONCURRENT_DOWNLOADS);
    const promises = [];
    files.forEach((file) => {
      promises.push(new Promise((resolve, reject) => {
        const path = `${folder}/${file}`
        return sem.take(() => archive.readFile(path).then((data) => {
          resolve({
            file: {
              name: file,
              path
            },
            data
          });
          sem.leave();
        }).catch((err) => {
          sem.leave();
          reject(err);
        }))
      }));
    });
    return Promise.all(promises);
  }

  getEntry(collection, slug, path) {
    return Promise.resolve({
      file: { path },
      data: getFile(path).content,
    });
  }

  persistEntry(entry, mediaFiles = [], options) {
    const newEntry = options.newEntry || false;
    const folder = entry.path.substring(0, entry.path.lastIndexOf('/'));
    const fileName = entry.path.substring(entry.path.lastIndexOf('/') + 1);
    window.repoFiles[folder] = window.repoFiles[folder] || {};
    window.repoFiles[folder][fileName] = window.repoFiles[folder][fileName] || {};
    if (newEntry) {
      window.repoFiles[folder][fileName] = { content: entry.raw };
    } else {
      window.repoFiles[folder][fileName].content = entry.raw;
    }
    return Promise.resolve();
  }

  deleteFile(path, commitMessage) {
    const folder = path.substring(0, path.lastIndexOf('/'));
    const fileName = path.substring(path.lastIndexOf('/') + 1);
    delete window.repoFiles[folder][fileName];
    return Promise.resolve();
  }
}
