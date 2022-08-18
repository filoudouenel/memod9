import React, { Component } from 'react';
import Navbar from './NavBar';
import { Routes, Route, Link, Navigate } from 'react-router-dom';
import { GiBrainTentacle } from "react-icons/gi";
import Coopernet from "../services/Coopernet";
import About from './About';
import FormLogin from './FormLogin';
import Table from "./my-tables/Table";
import OthersTables from './others-tables/OthersTables';

class App extends Component {
  state = {
    coopernet: new Coopernet(),
    token: "",
    error_msg: "",
    is_logged_in: false,
    admin_mode: false,
  }
  handleSubmitFormLogin = async (event) => {
    try {
      console.log(`Dans handleSubmitFormLogin`);
      event.preventDefault();
      const login = document.getElementById("edit-name").value;
      const pwd = document.getElementById("edit-pass").value;
      await this.state.coopernet.logUser(login, pwd);
      this.setState(() => {
        return { is_logged_in: true };
      });
    }
    catch (error) {
      console.error("Erreur attrapée dans handleSubmitFormLogin : ", error.message);
      this.setState(() => {
        return { error_msg: "Erreur attrapée dans handleSubmitFormLogin : " + error.message };
      });
    }
  }
  handleAdministrationMode = (event) => {
    console.log(`Dans handleAdministrationMode`);
    this.setState((state, props) => {
      return { admin_mode: !state.admin_mode };
    });
  }
  componentDidMount = async () => {
    try {
      const token = await this.state.coopernet.getToken();
      console.log(`Token dans componentDidMount : `, token);

      const user = await this.state.coopernet.isLoggedIn();
      console.log(`user dans componentDidMount : `, user);

    }
    catch (error) {
      console.error("Erreur attrapée dans componentDidMount : ", error.message);
      this.setState(() => {
        return { error_msg: "Erreur attrapée dans componentDidMount : " + error.message };
      });
    }
  }
  render() {
    return (
      <div className="App">
        <header className="bg-secondary" id="main-header">

          <div className='container '>
            <div className="row align-items-center">
              <div className="col"></div>

              <div className="col d-flex justify-content-center">
                <h1 id="title-memo" className="text-light">
                  <Link className="text-light m-2" to="/my-tables"><GiBrainTentacle className="icon-logo" /></Link>e<span id="m-memo">M</span>o
                </h1>
              </div>
              <div className="col text-light">
                {/* icône des paramètres (engrenage) */}
                <div className={this.state.admin_mode ? "text-warning d-flex align-items-center gap-1" : "text-white d-flex align-items-center gap-1"}
                  onClick={e => {
                    this.handleAdministrationMode();
                  }}>
                  <svg

                    role="button"
                    stroke="currentColor"
                    fill="currentColor"
                    strokeWidth="0"
                    viewBox="0 0 14 16"
                    height="1.5rem"
                    width="1.5rem"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path d="M14 8.77v-1.6l-1.94-.64-.45-1.09.88-1.84-1.13-1.13-1.81.91-1.09-.45-.69-1.92h-1.6l-.63 1.94-1.11.45-1.84-.88-1.13 1.13.91 1.81-.45 1.09L0 7.23v1.59l1.94.64.45 1.09-.88 1.84 1.13 1.13 1.81-.91 1.09.45.69 1.92h1.59l.63-1.94 1.11-.45 1.84.88 1.13-1.13-.92-1.81.47-1.09L14 8.75v.02zM7 11c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3z"></path>
                  </svg>
                  {this.state.admin_mode ? <span role="button">Désactiver le mode administration</span> : <span role="button">Activer le mode administration</span>}
                </div>
                {this.state.coopernet.url_server == 'https://coopernet.fr/' ? "" : (<div>{this.state.coopernet.url_server}</div>)}
              </div>
            </div>
          </div>


        </header>
        <main className='container'>
          {this.state.error_msg && (
            <div className='text-danger container'>
              {this.state.error_msg}
            </div>
          )}


          <Routes>
            {/* de la route la plus spécifique à la plus générique */}
            <Route path="/about" element={<About />} />
            <Route path="/my-tables" element={<Table admin_mode={this.state.admin_mode} coopernet={this.state.coopernet} userIsLogged={this.state.is_logged_in} />} />
            <Route path="/others-tables" element={<OthersTables coopernet={this.state.coopernet} userIsLogged={this.state.is_logged_in} />} />
            <Route path="/" element={!this.state.is_logged_in ? (
              <FormLogin handleSubmitFormLogin={this.handleSubmitFormLogin} />
            ) : (
              <Navigate to="/my-tables" />
            )} />
          </Routes>
        </main>
        <footer>
          <Navbar />
        </footer>
      </div>
    );
  }
}


export default App;
