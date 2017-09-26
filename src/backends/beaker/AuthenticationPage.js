import PropTypes from 'prop-types';
import React from 'react';
import Button from "react-toolbox/lib/button";
import { Card, Icon } from "../../components/UI";
import logo from "../git-gateway/netlify_logo.svg";
import styles from "../git-gateway/AuthenticationPage.css";

const archive = window.DatArchive ? new DatArchive(document.location.origin) : null;

export default class AuthenticationPage extends React.Component {
  static propTypes = {
    onLogin: PropTypes.func.isRequired,
  };

  constructor(props) {
    super(props);
    this.state = { isOwner: false };
    if (archive) {
      archive.getInfo().then(info => {
        this.setState({ isOwner: info.isOwner });
      });
    }
  }

  handleLogin = (e) => {
    e.preventDefault();
    this.props.onLogin(this.state);
  };

  render() {
    let content;
    if (!archive) {
      content =
        <div>
          <p className={styles.message}>
            This editor uses unique features to publish to the "Distributed Web" that
            are only available with the Beaker Browser.
          </p>
          <p className={styles.message}>
            <a href="https://beakerbrowser.com/">Download Beaker Browser here</a>
          </p>
        </div>;
    } else {
      content =
        <div>
          <p className={styles.message}>
            <strong>Excellent!</strong>
          </p>
          <p className={styles.message}>
            You are running this page inside Beaker Browser and
            you own this Dat Archive, so you can edit this blog.
          </p>
          <Button
            className={styles.button}
            raised
            onClick={this.handleLogin}
          >
            <Icon type="login" /> Login
          </Button>
        </div>;
    }
    return (<section className={styles.root}>
      <Card className={styles.card}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <img src={logo} style={{ width: '20%', marginRight: '0.8em' }} role="presentation" />
          Netlify CMS for Beaker Browser
        </div>
        {content}
      </Card>
    </section>);
  }
}
