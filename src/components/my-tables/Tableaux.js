import React, { Component } from "react";
import NestedDropdown from "./NestedDropdown";
import Colonne from "./Colonne";
import Modal from "react-bootstrap/Modal";
import Button from "react-bootstrap/Button";
import { Link, Navigate } from "react-router-dom";
import { AiOutlineClose } from "react-icons/ai";

class Tableaux extends Component {
  constructor(props) {
    //console.log("dans le constructeur de tableaux");

    super(props);
    this.state = {
      coopernet: this.props.coopernet,
      userIsLogged: this.props.userIsLogged,
      addingACard: false,
      editingACard: false,
      addingATerm: false,
      msgError: "",
      terms: [],
      colonnes: [], //ici sont stockées les colonnes et les cartes
      need_get_terms: true,
      term_name: ""
    };
    this.render_modal_add_edit_card = true;
    this.themeId = 0;
    this.columnId = 0;
    this.editedCard = null;
    this.editedColumn = null;
    this.editedCardIndexes = null;
    this.timeoutChangeTermID = null;
  }
  componentDidMount() {
    // création de la requête pour obtenir les thématiques
    console.log('Dans componentDidMount de Tableaux : ', this.state.coopernet);
    this.state.coopernet.getTerms(this.successTerms, this.failedTerms);
  }
  unlog = () => {
    console.log("Dans unlog");
    const state = { ...this.state };
    state.userIsLogged = false;
    this.setState(state);
  };

  /**
   * Récupère l'index de la colonne actuelle puis l'index de la colonne
   * précédente ou suivante puis récupère l'index du term de tanonomie
   * pour le donner en paramètre à la fonction qui est chargée de modifier
   * la carte
   */
  moveCard = (card, column, direction) => {
    console.log("Dans moveCard");
    //console.log(card,column,direction);

    // récupération de l'index de la colonne
    const current_column_index = this.state.colonnes.indexOf(column);
    console.log("index de la colonne : ", current_column_index);
    let new_index_drupal_column = 0;

    switch (direction) {
      case "right":
        // récupération de l'index suivant
        const next_column_index = (current_column_index + 1) % 4;
        console.log("index suivant : ", next_column_index);
        new_index_drupal_column = this.state.colonnes[next_column_index].id;
        break;
      case "left":
        // récupération de l'index précédent
        let previous_column_index = (current_column_index - 1) % 4;
        previous_column_index =
          previous_column_index === -1 ? 3 : previous_column_index;
        console.log("index précédent : ", previous_column_index);
        new_index_drupal_column = this.state.colonnes[previous_column_index].id;
        break;
      default:
        console.log("Pb dans moveCard " + direction + ".");
    }
    console.log("nouvel index de la carte : ", new_index_drupal_column);
    this.state.coopernet.createReqEditColumnCard(
      card.id,
      this.state.coopernet.user.uname,
      this.state.coopernet.user.upwd,
      new_index_drupal_column,
      this.themeId,
      this.successEditColumnCard,
      this.failedEditColumnCard
    );
  };
  ;
  successEditColumnCard = themeid => {
    console.log("Dans successEditColumnCard");
    // Rappel de la fonction qui va chercher la liste des cartes pour une thématique
    this.state.coopernet.createReqCards(
      themeid,
      this.successGetCards,
      this.failedCards,
      -1
    );
  };
  failedEditColumnCard = () => {
    console.log("Dans failedEditColumnCard");
  };
  successEditCard = (themeid, reload_current_term) => {
    console.log("#############Dans successEditCard - reload_current_term : ", reload_current_term);

    // Rappel de la fonction qui va chercher la liste des cartes pour
    // une thématique. Si reload_current_term est vrai, on recharge
    // le terme en cours. C'est utile dans le cas d'un déplacement de carte.
    themeid = (reload_current_term) ? this.themeId : themeid;
    this.state.coopernet.createReqCards(
      themeid,
      this.successGetCards,
      this.failedCards,
      -1
    );
  };

  failedEditCard = () => {
    console.log("Dans failedEditCard");
  };
  successAddCard = themeid => {
    console.log("Dans successAddCard");
    // Rappel de la fonction qui va chercher la liste des cartes pour une thématique
    this.state.coopernet.createReqCards(
      themeid,
      this.successGetCards,
      this.failedCards,
      -1
    );
  };
  failedAddCard = () => {
    console.log("Dans failedAddCard");
  };
  successAddOrEditTerm = (tid, action_type) => {
    console.log(
      "Dans successAddOrEditTerm - Action : " +
      action_type +
      " sur tid : " +
      tid
    );
    const state = { ...this.state };
    state.addingATerm = false;
    this.setState(state);

    // récupération de l'index du terme concerné pour changer la propriété "selected"
    let term_index = state.terms.findIndex(element => {
      return element.id === tid;
    });
    // création de la requête pour obtenir les thématiques

    this.state.coopernet.getTerms(this.successTerms, this.failedTerms);

    if (action_type !== "added") state.terms[term_index].selected = true;

    this.setState(state);
    // création de la requête pour obtenir les cartes correspondantes à la thématique
    if (action_type === "added") this.state.coopernet.createReqCards(
      tid,
      this.successGetCards,
      this.failedCards,
      -1
    );
  };
  failedAddOrEditTerm = () => {
    console.log("Dans failedAddOrEditTerm");
  };
  successRemoveCard = () => {
    console.log("Dans successRemoveCard " + this.themeId);
    // On enlève la fenêtre modal de suppression/modification
    this.render_modal_add_edit_card = false;
    // Attention pour que l'ajout d'une carte soit à nouveau possible,
    // il faut réinitialiser les propriétés editingACard et addingACard
    this.state.editingACard = false;
    this.state.addingACard = false;
    // Rappel de la fonction qui va chercher la liste des cartes pour une thématique
    this.state.coopernet.createReqCards(
      this.themeId,
      this.successGetCards,
      this.failedCards,
      -1
    );
  };
  failedRemoveCard = () => {
    console.log("Dans failedRemoveCard");
  };
  successRemoveTerm = () => {
    console.log("Dans successRemoveTerm ");
    // Rappel de la fonction qui va chercher la liste des terms
    this.state.coopernet.getTerms(this.successTerms, this.failedTerms);
    // on supprime les colonnes du state
    const state = { ...this.state };
    state.colonnes = [];
    this.setState(state);
  };
  failedRemoveTerm = () => {
    console.log("Dans failedRemoveTerm");
  };
  successTerms = terms => {
    console.log("Dans successTerms");
    console.log("Termes avant : ", terms);
    const state = { ...this.state };
    state.terms = terms;
    this.setState(state);
  };
  failedTerms = () => {
    console.log("Dans failedTerms");
  };
  /**
   * @param  {array} cols
   * @param  {number} termId
   * @param  {number} depth
   * @param  {string} term_name
   * @param  {boolean} has_subterm
   */
  successGetCards = (cols, termId, depth, term_name, has_subterm) => {
    console.log("Dans successGetCards pour le term : ",
      term_name, " has_subterm : ", has_subterm, "colonnes : ", cols);
    // Des cartes sont-elles liées à cette thématique
    let term_has_cards = false;
    for (let i = 0; i < cols.length; i++) {
      if (cols[i].cartes.length > 0) {
        term_has_cards = true
        break;
      }
    }
    // si le term cliqué n'est pas de niveau 0 sans carte et avec sous-termes
    // ou si le term cliqué est de niveau 0 et avec cartes
    // alors on change la rubrique
    console.log("################ - depth - term_has_cards - term_name", depth, term_has_cards, term_name);
    if ((!(depth === 1 && !term_has_cards && has_subterm)) ||
      (depth === 1 && term_has_cards)) {

      cols.sort((a, b) => a.id - b.id);
      console.log("Colonnes : ", cols);
      const state = { ...this.state };
      state.colonnes = cols;

      // on sait maintenant quel term (thématique) est affiché
      this.themeId = termId;
      state.term_name = term_name;
      this.setState(state);
    }

  };
  failedCards = () => {
    console.log("Dans failedCards");
  };

  handleSubmitAddOrEditCard = (event, editedCard = false, new_term = null) => {
    console.log("dans handleSubmitAddOrEditCard - carte modifiée = ", editedCard);

    event.preventDefault();
    // récupération des éléments du formulaire

    const new_card = {
      question: document.getElementById("inputquestion").value.trim(),
      reponse: document.getElementById("inputreponse").value.trim(),
      explication: document.getElementById("inputexplication").value,
      colonne: this.numCol
    }
    // Ajout d'une carte si editedCard est faux
    if (!editedCard) {
      this.state.coopernet.createReqAddCards(
        new_card,
        this.themeId,
        this.successAddCard,
        this.failedAddCard
      );
    } else {
      // Modification de la carte si editedCard est une carte
      console.log(
        "dans handleSubmitAddOrEditCard : appel de createReqEditCard"
      );
      // Permet de gérer le changement de Terme d'une Carte
      const themeId = (new_term) ? new_term.id : this.themeId;
      const reload_current_term = (new_term) ? true : false;
      // si changement de term pour la carte, on rafraîchit le term name

      // arguments num_card,login,pwd,question,reponse,themeid,columnid,callbackSuccess,callbackFailed
      /* console.log("num_card = ", editedCard.id);
      console.log("login = ", this.state.coopernet.user.uname);
      console.log("question = ", editedCard.question);
      console.log("reponse = ", editedCard.reponse);
      console.log("explication = ", editedCard.explication);
      console.log("themeid = ", themeId);
      console.log("columnid = ", editedCard.colonne); */

      // Supression des espaces en début et en fin de chaîne de caractères
      editedCard.question = editedCard.question.trim();
      editedCard.reponse = editedCard.reponse.trim();
      this.state.coopernet.createReqEditCard(
        editedCard,
        themeId,
        editedCard.colonne,
        this.successEditCard,
        this.failedEditCard,
        reload_current_term
      );

    }

    const state = { ...this.state };
    state.addingACard = false;
    state.editingACard = false;
    this.editedCard = null;
    this.editedColumn = null;
    this.editedCardIndexes = null;
    this.setState(state);
  };
  handleCloseForm = event => {
    console.log("dans handleCloseForm");
    const state = { ...this.state };
    state.addingACard = false;
    state.editingACard = false;
    this.editedCard = null;
    this.editedColumn = null;
    this.editedCardIndexes = null;
    this.setState(state);
  };
  /**
   * @param  {} e
   * @param  {} term_id
   * @param  {} indexes
   * @param  {} term_name
   * @param  {boolean} has_subterm
   */
  handleClickDropdownToggle = (e, term_id, indexes, term_name, has_subterm) => {
    console.log("ici dans handleClickDropdownToggle");
    console.log("chemin du terme clické : ", indexes);
    console.log("profondeur : ", indexes.length);
    console.log("State des terms : ", this.state.terms);
    console.log("has_subterm : ", has_subterm);

    e.preventDefault();
    const state = { ...this.state };

    // si on a cliqué sur un niveau 1 qui était "selected" et "close" alors
    // on ne va pas chercher les cartes correspondantes et on se contente
    // de passer le terme de nivau 0 à "open"
    if ((indexes.length === 1) &&
      state.terms[indexes[0]].selected &&
      !state.terms[indexes[0]].open) {
      // on passe le terme de nivau 0 à "open"
      console.log("#############################cas 1");
      state.terms[indexes[0]].open = true;
    } else if ((indexes.length === 1) &&
      state.terms[indexes[0]].open) {
      console.log("#############################cas 2");

      this.browseTreeToManageSelected(state.terms, indexes);
      this.state.coopernet.createReqCards(
        term_id,
        this.successGetCards,
        this.failedCards,
        indexes.length,
        term_name
      );
      state.terms[indexes[0]].open = false;

    }
    else {
      console.log("#############################cas 3. Term : ",
        term_name, " - hassubterm : ", has_subterm);
      // on gère l'état des terms (selected, open) grâce à une fonction récursive
      // à laquelle on passe par référence state.terms
      this.browseTreeToManageSelected(state.terms, indexes);
      this.state.coopernet.createReqCards(
        term_id,
        this.successGetCards,
        this.failedCards,
        indexes.length,
        term_name,
        has_subterm
      );
      //state.term_name = term_name;
    }

    this.setState(state);

  };
  /**
   * L'idée est ici de rappeler de façon récursive cette fonction avec
   * le niveau de profondeur de l'élément
   * Récupère en argument et par référence l'objet state.terms pour le rendre
   * modifié avant un setState dans la fonction appelante
   * @terms : le tableau de tous les terms
   * @indexes : le tableau (string) qui indique où se trouve l'élément cliqué
   * @depth : profondeur du term en cours qui a pour propriété childre (tableau de term)
   */
  browseTreeToManageSelected = (terms, indexes, depth = 0) => {
    terms.forEach((term, i) => {
      /* console.log("################################ dans forEach de browseTreeToManageSelected");
            console.log("term.name : ", term.name);
            console.log("indexes : ", indexes);
            console.log("index du term cliqué : ", indexes[depth]);
            console.log("profondeur : ", depth);
            console.log("index du term en cours : ", i); */


      if (indexes.length > depth && indexes[depth] === i) {
        // dans le cas où l'on a cliqué sur un term de niveau 0
        // et que le terme est déjà sélectionné, on le déselectionne
        //console.log("Première condition");
        if (depth === 0 &&
          term.selected &&
          term.hasOwnProperty("open") &&
          term.open &&
          indexes.length === 1) {
          //term.selected = false;
          console.log("Deuxième condition");
          term.open = false;
        }
        else {
          //console.log("Troisième condition");
          term.selected = true;
          term.open = true;
        }
      } else if (i.toString() === indexes[depth]) {
        //console.log("cas où l'index correspond à celui du terme cliqué", term.name);
        term.selected = true;
        term.open = true;
      }
      else {
        //console.log("Quatrième condition");
        term.selected = false;
        term.open = false;
      }
      // Quand on a cliqué sur un sous-menu, on "ferme" le term de niveau 0 correspondant
      if (indexes.length > 1 && depth === 0) {
        term.open = false;
      }
      if (term.hasOwnProperty("children")) {
        this.browseTreeToManageSelected(term.children, indexes, depth + 1);
      }
    });
  };
  renderFormAddOrEditCard = () => {
    console.log("Dans renderFormAddOrEditCard");
    /* console.log(this.state.editingACard); */
    if (this.state.addingACard || this.state.editingACard) {
      let edit = this.state.editingACard ? this.editedCard : false;
      /* console.log(
        "addingACard = ",
        this.state.addingACard,
        "editingACard = ",
        this.state.editingACard,
        "theme = " + this.themeId
      ); */
      return (
        <Modal
          show={true}
          onHide={this.handleCloseForm}
          size="lg"
          className="modal-large"
        >
          <Modal.Header className="d-flex justify-content-between">
            <Modal.Title>Gérer la carte</Modal.Title>
            <AiOutlineClose className="icon-click"
              onClick={e => this.handleCloseForm()}
            />
          </Modal.Header>
          <Modal.Body>
            {
              <>
                {/* formulaire ici */}
                <h3>Modification de la carte</h3>
                <form
                  id="add-or-edit-card"
                  onSubmit={e => {
                    this.handleSubmitAddOrEditCard(e, edit);
                  }}
                >
                  <div id="div-question" className="div-label-form">
                    <label className="label-large">
                      <div>Question :</div>
                      {this.state.addingACard && (
                        <input
                          type="text"
                          id="inputquestion"
                          autoFocus
                          className="ml-4 input-large"
                        />
                      )}
                      {this.state.editingACard && (
                        <input
                          onChange={e =>
                            this.handleChangeCard(e, this.editedCard)
                          }
                          type="text"
                          id="inputquestion"
                          autoFocus
                          className="ml-4 input-large"
                          value={this.editedCard.question}
                        />
                      )}
                    </label>
                  </div>
                  <div id="div-reponse" className="div-label-form">
                    <label className="label-large">
                      <div>Réponse :</div>
                      {this.state.addingACard && (
                        <textarea
                          type="text"
                          autoFocus
                          className="ml-4 textarea-large"
                          id="inputreponse"
                        />
                      )}
                      {this.state.editingACard && (
                        <textarea
                          onChange={e =>
                            this.handleChangeCard(e, this.editedCard)
                          }
                          type="text"
                          autoFocus
                          className="ml-4 textarea-large"
                          id="inputreponse"
                          value={this.editedCard.reponse}
                        />
                      )}
                    </label>
                  </div>
                  <div id="div-explication" className="div-label-form">
                    <label className="label-large">
                      <div>Explication :</div>
                      {this.state.addingACard && (
                        <textarea
                          type="text"
                          autoFocus
                          className="ml-4 textarea-large"
                          id="inputexplication"
                        />
                      )}
                      {this.state.editingACard && (
                        <textarea
                          onChange={e =>
                            this.handleChangeCard(e, this.editedCard)
                          }
                          type="text"
                          autoFocus
                          className="ml-4 textarea-large"
                          id="inputexplication"
                          value={this.editedCard.explication}
                        />
                      )}
                    </label>
                  </div>
                  <button
                    type="submit"
                    className="btn btn-default btn-success button-normal-size"
                  >
                    Envoyer
                  </button>
                </form>
              </>
            }
            {this.state.editingACard && (this.renderNestedTermList())}
          </Modal.Body>
          <Modal.Footer>
            {(this.editedCard !== null && this.state.editingACard) && (
              <Button
                variant="warning"
                onClick={() => this.state.coopernet.removeCard(
                  this.editedCard.id,
                  this.state.coopernet.user.uname,
                  this.state.coopernet.user.upwd,
                  this.successRemoveCard,
                  this.failedRemoveCard
                )
                }
                className="ml-4 bg-danger text-light "
              >
                Supprimer la Supprimer la carte
              </Button>
            )}

          </Modal.Footer>
        </Modal>
      );
    } else return "";
  };
  handleChangeCard = (event, card) => {
    console.log("Dans handleChangeCard");
    event.preventDefault();

    let state = { ...this.state };

    // Récupération des champs modifiés via le formulaire
    let question = document.getElementById("inputquestion").value;
    let reponse = document.getElementById("inputreponse").value;
    let explication = document.getElementById("inputexplication").value;

    // récupération de l'index des colonnes
    let index_columns = state.colonnes.indexOf(this.editedColumn);
    // récupération de l'index des cartes
    let index_cards = state.colonnes[index_columns].cartes.indexOf(card);

    state.colonnes[index_columns].cartes[index_cards].question = question;
    state.colonnes[index_columns].cartes[index_cards].reponse = reponse;
    state.colonnes[index_columns].cartes[index_cards].explication = explication;
    this.setState(state);
  };
  handleChangeTerm = (event, term, tid_parent, indexes) => {
    console.log("Dans handleChangeTerm - Term modifié : ", term);
    event.preventDefault();
    let state = { ...this.state };
    let tid = term.id;

    // récupération de l'index du term
    let index_term = state.terms.indexOf(term);
    console.log("index_term : ", index_term);

    // on veut placer ce terme en tant que fils de
    if (tid_parent) {
      console.log("le parent du term", term, "sera : ", tid_parent);
      this.state.coopernet.createReqAddOrEditTerm(
        this.state.coopernet.user.uname,
        this.state.coopernet.user.upwd,
        term.name,
        tid,
        this.successAddOrEditTerm,
        this.failedAddOrEditTerm,
        tid_parent
      );
    } else { // on veut simplement modifier ce terme
      // Récupération des champs modifiés via le formulaire
      let term_name = event.target.querySelector("#edit-term-value").value;
      // modification du state local
      // Il faut aller chercher ici le bon terme à modifier en fonction de indexes
      let current_term = {};
      for (let i = 0; i < indexes.length; i++) {
        if (i === 0) {
          current_term = state.terms[indexes[i]];
          if (i === (indexes.length - 1)) current_term.name = term_name;
        }
        else if (i === (indexes.length - 1)) {
          current_term = current_term.children[indexes[i]];
          current_term.name = term_name;
        }
        else {
          current_term = current_term.children[indexes[i]];
        }
      }
      //state.terms[index_term].name = term_name;
      this.setState(state);
      // Enregistrement si la rubrique n'est ni vide ni un nombre
      if (term_name && isNaN(term_name)) {
        this.state.coopernet.createReqAddOrEditTerm(
          this.state.coopernet.user.uname,
          this.state.coopernet.user.upwd,
          term_name,
          tid,
          this.successAddOrEditTerm,
          this.failedAddOrEditTerm
        );
      }
    }


  };
  handleDeleteTerm = (event, term, nb_cards) => {
    console.log("Dans handleDeleteTerm");
    console.log(term);
    if (nb_cards) console.log("Vous devez d'abord effacer toutes les cartes : ", nb_cards);
    else {
      this.state.coopernet.removeTerm(
        term.id,
        this.state.coopernet.user.uname,
        this.state.coopernet.user.upwd,
        this.successRemoveTerm,
        this.failedRemoveTerm)
    }
  }
  handleSubmitEditTerm = (event, term) => {
    console.log("Dans handleSubmitEditTerm - Term modifié : ", term);
    event.preventDefault();
  };
  /**
   * Gestion de la soumission du formulaire d'identification
   */

  handleSubmitAddOrEditTerm = event => {
    console.log("dans handleSubmitAddOrEditTerm");
    event.preventDefault();
    const term_label = document.getElementById("add-term-value").value;
    const tid = 0; // dans le cas d'un ajout, on a pas encore le tid
    if (term_label && isNaN(term_label)) {
      console.log("input du term non vide et pas un nombre");
      this.state.coopernet.createReqAddOrEditTerm(
        this.state.coopernet.user.uname,
        this.state.coopernet.user.upwd,
        term_label,
        tid,
        this.successAddOrEditTerm,
        this.failedAddOrEditTerm
      );
    } else {
      console.log("input du term vide ou nombre");
      const state = { ...this.state };
      state.addingATerm = false;
      this.setState(state);
    }
  };
  renderFormLogin = () => {
    //console.log("Dans formLogin");
    if (!this.state.userIsLogged) {
      return (
        <form id="login-form" onSubmit={this.handleSubmit}>
          <label className="mr-4 label-login-form">
            <div>login :</div>
            <input
              id="edit-name"
              name="name"
              type="text"
              className="validate ml-2"
            />
          </label>
          <label className="mr-4 label-login-form">
            <div>mot de passe :</div>
            <input
              id="edit-pass"
              name="pass"
              type="password"
              className="validate ml-2"
            />
          </label>
          <button type="submit" className="btn btn-default btn-info">
            Sign in
          </button>
        </form>
      );
    } else return "";
  };
  renderFormAddOrEditTerm = () => {
    //console.log("Dans renderFormAddOrEditTerm");
    if (this.state.userIsLogged && this.state.addingATerm) {
      console.log(
        "this.state.userIsLogged && this.state.addingATerm",
        this.state.userIsLogged,
        this.state.addingATerm
      );
      return (
        <form
          id="add-term"
          onSubmit={this.handleSubmitAddOrEditTerm}
          className="d-flex justify-content-center align-items-center flex-wrap"
        >
          <label className="label-login-form d-flex align-items-center ">
            <div className="m-2">Nouvelle rubrique :</div>
            <input
              id="add-term-value"
              name="add-term-name"
              type="text"
              className="validate m-2"
              autoFocus
            />
          </label>

          <button type="submit" className="btn btn-default btn-info m-2 mb-3">
            Ajouter
          </button>
        </form>
      );
    } else return "";
  };
  /**
   * Affichage des termes dans un menu */
  renderTerms = () => {
    //console.log("Dans renderTerms");
    //console.log("this ", this);
    if (this.state.userIsLogged) {
      return (
        <section id="section-terms">
          <button
            id="add-user-term"
            className="btn btn-success m-2"
            title="Ajouter une thématique"
            onClick={e => {
              this.changeStateAddingATerm();
            }}
          >
            +
          </button>
          <nav>
            <ul className="ul-nested-dropdown">
              {this.state.terms.map((term, index) => (
                <NestedDropdown
                  key={term.id}
                  term={term}
                  terms={this.state.terms}
                  onClickDropdownToggle={this.handleClickDropdownToggle}
                  index={index}
                  onChangeTerm={this.handleChangeTerm}
                  onDeleteTerm={this.handleDeleteTerm}
                />
              ))}
            </ul>
          </nav>
        </section>
      );
    }
  };
  /**
   * Affichage des termes sous forme de liste afin de pouvoir
   * changer de term une carte
   */
  renderNestedTermList = (terms = this.state.terms) => {
    console.log("Dans renderNestedTermList");
    console.log("Carte modifiée : ", this.editedCard);
    console.log("Indexes de la carte : ", this.editedCardIndexes);
    if (this.editedCard) {
      return (
        <>
          <hr />
          <h3 className="">Déplacer la carte</h3>
          <ul className="list-group list-group-terms">
            {terms.map(term => {
              return term.name === this.editedCard.name ? (
                ""
              ) : (
                <li
                  key={term.id}
                  title={`Cliquer pour déplacer la carte en cours vers la rubrique ${term.name}`}
                  className="list-group-item"
                  onClick={e =>
                    this.handleSubmitAddOrEditCard(e, this.editedCard, term)
                  }
                >
                  {term.name}
                  {term.hasOwnProperty("children") &&
                    this.renderNestedTermList(term.children, this.editedCardIndexes)
                  }
                </li>
              );
            })}
          </ul>
        </>
      );
    }

  }
  renderDropdownButton = (terms_array, menu_class = "not-first") => {
    console.log("dans renderDropdownButton", terms_array);
    const m_class = "coop-menu " + menu_class;
    return (
      <ul className={m_class} >
        {(terms_array.length !== 0) &&
          terms_array.map(term => {
            let submenu;
            if (term.hasOwnProperty("children") && term.children.length > 0) {
              //console.log("xxxxxxxxxxxxxxxxx appel récursif : ", term.children);
              submenu = this.renderDropdownButton(term.children);
            }
            return (
              <li key={term.id}>
                {term.name}
                {submenu}
              </li>
            );
          })}
      </ul>
    )
  }
  handleClickEditingCard = (e, card, column, col_index, card_index) => {
    console.log("dans handleClickEditingCard : ", card, column, col_index, card_index);
    const state = { ...this.state };
    state.editingACard = true;
    this.editedCard = card;
    this.editedColumn = column;
    this.editedCardIndexes = [col_index, card_index];
    this.setState(state);
  };
  handleClickAddingACard = numCol => {
    console.log("dans handleClickAddingACard");
    console.log("dans handleClickAddingACard. render_modal_add_edit_card : ", this.render_modal_add_edit_card);
    console.log("Numéro de colonne dans laquelle ajouter la carte : " + numCol);
    this.numCol = numCol;
    const state = { ...this.state };
    this.render_modal_add_edit_card = true;
    state.addingACard = true;
    this.setState(state);
  };
  changeStateAddingATerm = () => {
    console.log("dans' changeStateAddingATerm");
    const state = { ...this.state };
    state.addingATerm = true;
    this.setState(state);
  };
  renderColumn = () => {
    if (this.state.colonnes.length) {
      return (
        <section className="row section-cards">
          {this.state.colonnes.map((col, index) => {
            return (
              <Colonne
                key={col.id}
                id={col.id}
                colonne={col}
                label={col.name}
                cards={col.cartes}
                onClickAddCard={this.handleClickAddingACard}
                onClickEditCard={this.handleClickEditingCard}
                onMoveCard={this.moveCard}
                onShowReponse={this.changeStateReponse}
                user={this.state.coopernet.user}
                col_index={index}
                coopernet={this.props.coopernet}
              />
            );
          })}
        </section>
      );
    }
  };

  
  changeStateReponse = (e, card, column) => {
    /* console.log("dans changeStateReponse");
    console.log("Theme : " + this.themeId);
    console.log("card : " + card);
    console.log("column : " + column.id); */
    // il faut maintenant changer le state de la carte en question en
    // retrouvant l'index de la colonne en fct de l'id de la colonne
    // puis l'index de la carte en fct de l'id de la carte
    let state = { ...this.state };
    let colonne_index = state.colonnes.indexOf(column);
    //console.log("Index de la colonne : " + colonne_index);
    let carte_index = state.colonnes[colonne_index].cartes.indexOf(card);
    //console.log("Index de la carte : " + carte_index);
    state.colonnes[colonne_index].cartes[carte_index].show_reponse = state
      .colonnes[colonne_index].cartes[carte_index].show_reponse
      ? false
      : true;

    this.setState(state);
  };
  render() {
    console.log('Dans render de Tableaux.js', this.state.coopernet);

    return (
      <div>
        {!this.state.userIsLogged && (<Navigate to="/" />)}
        <div className="container">
          {this.state.msgError && (
            <div className="alert alert-warning">{this.state.msgError}</div>
          )}
          {this.renderFormAddOrEditCard()}
          {this.renderTerms()}
          {this.renderFormAddOrEditTerm()}
          {this.state.term_name && (
            <h2 className="title-term-name">{this.state.term_name}</h2>
          )}
          {this.renderColumn()}
        </div>
      </div>
    );
  }
}

export default Tableaux;
