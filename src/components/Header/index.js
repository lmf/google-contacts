import { useState } from 'react';

import styles from './index.module.scss';

const Header = () => {
  return (
    <div className={styles.header}>
      <div className={styles['header-wrapper']}>
        <div className={styles.cell}>名称</div>
        <div className={styles.cell}>电子邮件</div>
        <div className={styles.cell}>电话号码</div>
      </div>
    </div>
  )
}

export default Header;