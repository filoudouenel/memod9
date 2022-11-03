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
    error_msg: "",
    is_logged_in: false,
    admin_mode: false,
  }
  handleSubmitFormLogin = async (event) => {
    try {
      console.log(`Dans handleSubmitFormLogin`);
      event.preventDefault();

      Coopernet.user.name = document.getElementById("edit-name").value;
      Coopernet.user.pwd = document.getElementById("edit-pass").value;

      await Coopernet.setOAuthToken();
      // on stocke le token oAuth dans local storage qui le stocke indéfiniment (tant que le cache n'est pas supprimé)
      // Le sessionStorage n'a pas été utilisé.
      localStorage.setItem('token', JSON.stringify(Coopernet.oauth.refresh_token));
      await Coopernet.isLoggedIn()

      this.setState(() => {
        return { is_logged_in: true, error_msg: "" };
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
    console.debug(`Dans handleAdministrationMode`);
    this.setState((state, props) => {
      return { admin_mode: !state.admin_mode };
    });
  }
  handleClickDisconnect = (e) => {
    e.preventDefault();
    if (localStorage.getItem('token')) {
      localStorage.removeItem('token');
    }
    Coopernet.oauth = {};
    this.setState(() => {
      return { is_logged_in: false };
    });
  }
  componentDidMount = async () => {
    try {
      const redirect = async () => {
        // Coopernet.getStorage() renvoie vrai un refreshtoken est valide dans le local storage
        if (await Coopernet.getStorage()) {
          const user = await Coopernet.isLoggedIn();
          console.debug(`user dans componentDidMount : `, user);
          this.setState(() => {
            return { is_logged_in: true };
          });
        }
      }
      redirect()
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
      <div className={this.state.admin_mode ? "App admin-mode" : "App no-admin"}>
        <header className="bg-secondary" id="main-header">

          <div className='container '>
            <div className="row align-items-center">
              

              <div className="col d-flex justify-content-center">
                <h1 id="title-memo" className="text-light">
                  <Link className="text-light m-2 text-decoration-none" to="/"><GiBrainTentacle className="icon-logo " /> e<span id="m-memo">M</span>o</Link>
                </h1>
              </div>
              
            </div>
            <div className="row">
            <div className="col text-light">
                {this.state.is_logged_in && (
                  <nav class="navbar navbar-expand-lg navbar-dark">
                    <a class="navbar-brand" href="#"></a>
                    <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarSupportedContent" aria-controls="navbarSupportedContent" aria-expanded="false" aria-label="Toggle navigation">
                      <span class="navbar-toggler-icon"></span>
                    </button>
                    <div class="collapse navbar-collapse mt-3" id="navbarSupportedContent">

                      <div className={'d-flex align-items-start m-0'}>
                        <div id="admin-link" className={this.state.admin_mode ? "text-warning d-flex align-items-start gap-1" : "text-white d-flex align-items-start gap-1"}
                          onClick={e => {
                            this.handleAdministrationMode();
                          }}>
                          {/* icône des paramètres (engrenage) */}
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
                        <span role={"button"} className={'ms-2 d-flex'} onClick={this.handleClickDisconnect}>
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none" viewBox="0 0 24 24"
                            strokeWidth="1.5"
                            height="1.5rem"
                            width="1.5rem"
                            stroke="currentColor"
                            className="w-6 h-6">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75"
                            />
                          </svg>
                          <span>Se déconnecter</span>
                        </span>
                      </div>
                    </div>
                  </nav>
                )}

                {Coopernet.url_server === 'https://coopernet.fr/' ? "" : (<div className='local'>{Coopernet.url_server}</div>)}
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
            <Route path="/my-tables" element={<Table admin_mode={this.state.admin_mode} userIsLogged={this.state.is_logged_in} />} />
            <Route path="/others-tables" element={<OthersTables userIsLogged={this.state.is_logged_in} />} />
            <Route path="/" element={!this.state.is_logged_in ? (
              <FormLogin handleSubmitFormLogin={this.handleSubmitFormLogin} />
            ) : (
              <Navigate to="/my-tables" />
            )} />
          </Routes>
        </main>
        <footer>
          <Navbar userIsLogged={this.state.is_logged_in} />
        </footer>
      </div>
    );
  }
}


export default App;
