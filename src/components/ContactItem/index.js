import { useState } from "react";

import styles from './index.module.scss';

const ContactItem = ({
  info,
  style
}) => {
  return (
    <div className={styles['contact-item']} style={style}>
      <div className={`${styles.cell} ${styles['contact-item-name']}`}>
        <span>{info.name}</span>
      </div>
      <div className={`${styles.cell} ${styles['contact-item-email']}`}>
        {info.email ? <span>{info.email}</span> : null}
      </div>
      <div className={`${styles.cell} ${styles['contact-item-phone']}`}>
        {info.phone ? <span>{info.phone}</span> : null}
      </div>
    </div>
  )
};

export default ContactItem;