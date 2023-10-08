import { useEffect, useState, useRef } from 'react';
import { List, AutoSizer, InfiniteLoader } from 'react-virtualized';

import Header from './components/Header';
import ContactItem from './components/ContactItem';
import styles from './App.module.scss';

const STATUS_LOADING = 1;
const STATUS_LOADED = 2;
/**
 * 每页请求的联系人数量
 */
const PAGE_SIZE = 20;

/**
 * Print the display name if available for 10 connections.
 */
async function listConnectionNames(pageToken) {
  let response;
  try {
    // Fetch first 10 files
    response = await window.gapi.client.people.people.connections.list({
      resourceName: 'people/me',
      pageSize: PAGE_SIZE,
      personFields: 'names,emailAddresses,phoneNumbers,coverPhotos',
      pageToken
    });
  } catch (err) {
    return err.message;
  }
  const {connections, nextPageToken, totalItems }
    = response.result;

  if (!connections || connections.length === 0) {
    return {
      total: 0,
      peoples: []
    };
  }

  const peoples = connections.map(({ names, phoneNumbers, emailAddresses, resourceName, coverPhotos }) => ({
    id: resourceName,
    name: names?.[0]?.displayName,
    phone: phoneNumbers?.[0]?.canonicalForm,
    email: emailAddresses?.[0].value
  }));

  return {
    total: totalItems,
    peoples,
    nextPageToken
  };
}

async function searchContacts(query) {
  let res;
  try {
    res = await window.gapi.client.people.people.searchContacts({
      query,
      pageSize: PAGE_SIZE,
      readMask: 'names,emailAddresses,phoneNumbers,coverPhotos'
    })
  } catch(e) {
    console.log(e.message);
  }

  if (res?.result) {
    const { results } = res.result;
    const peoples = results.map(item => {
      const {resourceName, names, phoneNumbers, emailAddresses} = item.person;

      return {
        id: resourceName,
        name: names?.[0].displayName,
        phone: phoneNumbers?.[0].canonicalForm,
        email: emailAddresses?.[0].value
      }
    });

    return {
      total: peoples.length,
      peoples
    };
  }
};

function App() {
  const [total, setTotal] = useState(0);
  const [contacts, setContacts] = useState([]);
  // const [loadedRowsMap, setLoadedRowsMap] = useState({});
  const loadedRowsMap = useRef({});
  // 记录请求promise，方便顺序调用
  const requestPromiseMap = useRef({ 0: Promise.resolve()})
  // 已经加载的页面map，第0页初始已经加载
  const requestPagesMap = useRef({ 0: true })
  const nextPageToken = useRef('');
  const isInit = useRef(false);

  useEffect(() => {
    if (isInit.current) return;
    isInit.current = true;
    listConnectionNames().then(result => {
      if (result?.peoples) {
        const temp = new Array(result.total);
        temp.splice(0, PAGE_SIZE, ...result.peoples);
        setContacts(temp);

        setTotal(result.total)
        nextPageToken.current = result.nextPageToken;
      }
      const temp = {};
      for (var i = 0; i < PAGE_SIZE; i++) {
        temp[i] = STATUS_LOADED;
      }
      loadedRowsMap.current = { ...loadedRowsMap.current, ...temp }
    });
  }, []);

  const requestConnectsByPage = (pageNum, targetPageNum, pageToken) => {
    requestPagesMap.current = { ...requestPagesMap.current, [pageNum]: true }

    return listConnectionNames(pageToken || nextPageToken.current).then(result => {
      if (result?.peoples) {
        nextPageToken.current = result.nextPageToken;

        const temp = {};
        const start = pageNum * PAGE_SIZE;
        for (var i = start; i < start + PAGE_SIZE; i++) {
          temp[i] = STATUS_LOADED;
        }
        loadedRowsMap.current = { ...loadedRowsMap.current, ...temp }

        setContacts(prev => {
          const temp = [...prev];
          temp.splice(pageNum * PAGE_SIZE, PAGE_SIZE, ...result.peoples);
          return temp;
        });

        if (pageNum < targetPageNum) {
          console.log('requestConnectsByPage again')
          return requestConnectsByPage(pageNum + 1, targetPageNum, result.nextPageToken);
        }

        return Promise.resolve();
      }
    });
  }

  const loadMoreRows = ({ startIndex, stopIndex }) => {
    const startPageNum = Math.floor(startIndex / PAGE_SIZE);
    const targetPageNum = Math.floor(stopIndex / PAGE_SIZE);

    for (let i = startPageNum; i <= targetPageNum; i++) {
      if (!requestPagesMap.current[i]) {
        const temp = {};
        for (let j = i * PAGE_SIZE; j < (targetPageNum + 1) * PAGE_SIZE; j++) {
          temp[j] = STATUS_LOADING;
        }
        loadedRowsMap.current = { ...loadedRowsMap.current, ...temp }
        const prevRequest = requestPromiseMap.current[i - 1];

        const promise = prevRequest.then(() => requestConnectsByPage(i, targetPageNum));
        requestPromiseMap.current = { ...requestPromiseMap.current, [targetPageNum]: promise }
        return promise;
      }
    }
  }

  const isRowLoaded = ({ index }) => {
    return !!loadedRowsMap.current[index];
  }

  const rowRenderer = ({index, isScrolling, isVisible, key, style}) => {
    const row = contacts[index];
    // const className = clsx(styles.row, {
    //   [styles.rowScrolling]: isScrolling,
    //   isVisible: isVisible,
    // });
    let content;
    if (loadedRowsMap.current[index] === STATUS_LOADED && row) {
      content = <ContactItem info={row} />
    } else {
      content = <div style={{ height: '56px' }}>loading</div>
    }

    return <div style={style} key={key}>{content}</div>;
  };

  const requestSearch = (query) => {
    if (!query.trim()) return;
    setTotal(0);
    searchContacts(query.trim()).then(result => {
      if (result?.peoples) {
        setContacts(result.peoples);
        setTotal(result.total);
        nextPageToken.current = '';
        const temp = {};
        for (var i = 0; i < total; i++) {
          temp[i] = STATUS_LOADED;
        }
        loadedRowsMap.current = temp;
      }
    });
  }

  return (
    <div className={styles.App}>
      <div className={styles.search}>
        <input type="text" onKeyUp={e => {
          console.log('#####', e.key);
          if (e.key === 'Enter') {
            requestSearch(e.target.value);
          }
        }} placeholder="查找" />
      </div>
      <Header />
      {total ? <InfiniteLoader
        isRowLoaded={isRowLoaded}
        loadMoreRows={loadMoreRows}
        rowCount={total}>
        {({onRowsRendered, registerChild}) => (
          <AutoSizer disableHeight>
            {({width}) => (
              <List
                ref={registerChild}
                className={styles.List}
                height={window.innerHeight - 100}
                onRowsRendered={onRowsRendered}
                rowCount={total}
                rowHeight={56}
                rowRenderer={rowRenderer}
                width={width}
              />
            )}
          </AutoSizer>
        )}
      </InfiniteLoader> : <p>loading</p>}
    </div>
  );
}

export default App;
