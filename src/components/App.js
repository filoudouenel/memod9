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
    is_logged_in: false
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
                {this.state.coopernet.url_server == 'https://coopernet.fr/' ? "" : this.state.coopernet.url_server}
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
            <Route path="/my-tables" element={<Table coopernet={this.state.coopernet} userIsLogged={this.state.is_logged_in} />} />
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
