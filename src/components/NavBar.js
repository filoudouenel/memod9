import React from 'react';
import { Link } from "react-router-dom";
const NavBar = () => {
  return (
    <ul className="list-unstyled d-flex justify-content-center mt-5">
      <li className="m-2"><Link to="/">Accueil</Link></li>
      <li className="m-2"><Link to="/my-tables">Mes tableaux</Link></li>
      <li className="m-2"><Link to="/about">A propos de l'application</Link></li>
    </ul>
  );
}

export default NavBar;