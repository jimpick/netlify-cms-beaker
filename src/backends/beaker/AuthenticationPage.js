import PropTypes from 'prop-types';
import React from 'react';
import Button from "react-toolbox/lib/button";
import { Card, Icon } from "../../components/UI";
import logo from "../git-gateway/netlify_logo.svg";
import styles from "../git-gateway/AuthenticationPage.css";
import GithubCorner from "./githubCorner";

const archive = window.DatArchive ? new DatArchive(document.location.origin) : null;
const githubUrl = "https://github.com/jimpick/netlify-cms-beaker";

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

  handleFork = (e) => {
    e.preventDefault();
    DatArchive.fork(document.location.origin).then(newArchive => {
      if (newArchive && newArchive.url) {
        document.location.href = newArchive.url;
      }
    });
  };

  render() {
    const { isOwner } = this.state;
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
      if (isOwner) {
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
      } else {
        content =
          <div>
            <p className={styles.message}>
              <strong>You aren't the owner of this blog, so you can't edit it.</strong>
            </p>
            <p className={styles.message}>
              But, you can fork it inside Beaker Browser, and make your own!
            </p>
            <Button
              className={styles.button}
              raised
              onClick={this.handleFork}
            >
              <Icon type="publish" /> Fork this Dat
            </Button>
          </div>;

      }
    }
    return (<section className={styles.root}>
      <GithubCorner url={githubUrl} />
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
