import React, { Component } from 'react';
import { Navigate, Link } from 'react-router-dom';
import NestedDropdown from './NestedDropdown';
import Column from './Column';
import Modal from "react-bootstrap/Modal";
import Button from "react-bootstrap/Button";
import { FiUserMinus, FiUserPlus } from "react-icons/fi";

class OthersTables extends Component {
  constructor(props) {
    super(props);
    this.state = {
      coopernet: this.props.coopernet,
      userIsLogged: this.props.userIsLogged,
      users: [],
      terms: [],
      my_terms: [],
      columns: [],
      other_user: null,
      show_users: true,
      editingACard: false,
      copied_cards: [],
      filter_name: ""
    }
    this.editedCard = null;
    this.editedColumn = null;
    this.editedCardIndexes = null;
  }
  componentDidMount = async () => {
    const users = await this.state.coopernet.getUsers();
    console.log('users dans componentDidMount de OthersTables : ', users);
    const state = { ...this.state };
    state.users = users;

    // récupération des termes de l'utilisateur
    this.state.coopernet.getTerms(this.successMyTerms, this.failedMyTerms);
    this.setState(state);
  }
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
  changeStateAnswer = (e, card, column) => {
    /* console.log("dans changeStateAnswer");
    console.log("Theme : " + this.themeId);
    console.log("card : " + card);
    console.log("column : " + column.id); */
    // il faut maintenant changer le state de la card en question en
    // retrouvant l'index de la column en fct de l'id de la column
    // puis l'index de la card en fct de l'id de la card
    let state = { ...this.state };
    let column_index = state.columns.indexOf(column);
    //console.log("Index de la column : " + column_index);
    let card_index = state.columns[column_index].cards.indexOf(card);
    //console.log("Index de la card : " + card_index);
    state.columns[column_index].cards[card_index].show_answer = state
      .columns[column_index].cards[card_index].show_answer
      ? false
      : true;

    this.setState(state);
  };
  handleClickEditingCard = (e, card, column, col_index, card_index) => {
    console.log("dans handleClickEditingCard de OthersTables : ", card, column, col_index, card_index);
    const state = { ...this.state };
    state.editingACard = true;
    this.editedCard = card;
    this.editedColumn = column;
    this.editedCardIndexes = [col_index, card_index];
    this.setState(state);
  };

  handleClickCopyCard = (e, card, term) => {
    e.stopPropagation();
    console.log('Dans handleClickCopyCard - card : ', card, "terme : ", term);
    this.state.coopernet.createReqAddCards(
      card,
      term.id,
      this.successAddCard,
      this.failedAddCard
    );
  }
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
    // on ne va pas chercher les cards correspondantes et on se contente
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
      this.state.coopernet.getCards(
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
        term_name, " - hassubterm : ", has_subterm, "card pour l'utilisateur : ", this.state.other_user);
      // on gère l'état des terms (selected, open) grâce à une fonction récursive
      // à laquelle on passe par référence state.terms
      this.browseTreeToManageSelected(state.terms, indexes);
      /* this.state.coopernet.createReqCards(
        term_id,
        this.successGetCards,
        this.failedCards,
        indexes.length,
        term_name,
        has_subterm,
        this.state.other_user.id
      ); */
      //state.term_name = term_name;
    }

    this.setState(state);

  };
  handleClickName = (e, o_user) => {
    console.log('dans handleClickName de OthersTables. User : ', o_user);
    this.state.coopernet.getTerms(this.successTerms, this.failedTerms, o_user);
    const state = { ...this.state };
    state.columns = [];
    this.setState(state);
  }
  handleClickHideUsers = (e) => {
    console.log('dans handleClickHideUsers');
    const state = { ...this.state };
    state.show_users = false;
    this.setState(state);
  }
  handleClickShowUsers = (e) => {
    console.log('dans handleClickShowUsers');
    const state = { ...this.state };
    state.show_users = true;
    this.setState(state);
  }
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
  successAddCard = (theme_id, card_id) => {
    console.log("Dans successAddCard");
    const state = { ...this.state };
    state.copied_cards.push(+ card_id);
    state.editingACard = false;
    this.setState(state);
  };
  failedAddCard = () => {
    console.log("Dans failedAddCard");
  };
  /**
   * @param  {array} cols
   * @param  {number} termId
   * @param  {number} depth
   * @param  {string} term_name
   * @param  {boolean} has_subterm
   */
  successGetCards = (cols, termId, depth, term_name, has_subterm) => {
    console.log("Dans successGetCards de OthersTables pour le term : ",
      term_name, " has_subterm : ", has_subterm, "columns : ", cols);
    // Des cards sont-elles liées à cette thématique
    let term_has_cards = false;
    for (let i = 0; i < cols.length; i++) {
      if (cols[i].cards.length > 0) {
        term_has_cards = true
        break;
      }
    }
    // si le term cliqué n'est pas de niveau 0 sans card et avec sous-termes
    // ou si le term cliqué est de niveau 0 et avec cards
    // alors on change la rubrique
    console.log("################ - depth - term_has_cards - term_name", depth, term_has_cards, term_name);
    if ((!(depth === 1 && !term_has_cards && has_subterm)) ||
      (depth === 1 && term_has_cards)) {

      cols.sort((a, b) => a.id - b.id);
      console.log("Columns : ", cols);
      const state = { ...this.state };
      state.columns = cols;

      // on sait maintenant quel term (thématique) est affiché
      this.themeId = termId;
      state.term_name = term_name;
      this.setState(state);
    }

  };
  failedCards = () => {
    console.log("Dans failedCards");
  };
  successTerms = (terms, user) => {
    console.log("Dans successTerms de OthersTables");
    console.log("Termes avant : ", terms);
    const state = { ...this.state };
    state.terms = terms;
    state.other_user = user;
    state.show_users = false;
    this.setState(state);
  };
  failedTerms = () => {
    console.log("Dans failedTerms de OthersTables");
  };
  successMyTerms = terms => {
    console.log("Dans successMyTerms de OthersTables");
    const state = { ...this.state };
    state.my_terms = terms;
    this.setState(state);
  };
  failedMyTerms = () => {
    console.log("Dans failedMyTerms de OthersTables");
  };
  renderColumn = () => {
    if (this.state.columns.length) {
      return (
        <section className="row section-cards">
          {this.state.columns.map((col, index) => {
            return (
              <Column
                key={col.id}
                id={col.id}
                column={col}
                label={col.name}
                cards={col.cards}
                onShowAnswer={this.changeStateAnswer}
                user={this.state.coopernet.user}
                col_index={index}
                copied_cards={this.state.copied_cards}
                onClickEditCard={this.handleClickEditingCard}
              />
            );
          })}
        </section>
      );
    }
  };
  renderFormMovingCard = () => {
    console.log("Dans renderFormMovingCard. Edited Card : ", this.state.editingACard);
    if (this.state.editingACard) {
      let edit = this.state.editingACard ? this.editedCard : false;
      console.log(
        "editingACard = ",
        this.state.editingACard,
        "theme = " + this.themeId
      );
      return (
        <Modal
          show={true}
          onHide={this.handleCloseForm}
          size="lg"
          className="modal-large"
        >
          <Modal.Header>
            <Modal.Title>Copier la card dans un de mes tableaux</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {this.state.editingACard && (this.renderNestedTermList())}
          </Modal.Body>
          <Modal.Footer>
            <Button variant="primary" onClick={e => this.handleCloseForm()}>
              Fermer
            </Button>
          </Modal.Footer>
        </Modal>
      );
    } else return "";
  };
  /**
   * Affichage des termes de sous forme de liste afin de pouvoir
   * changer de term une card
   */
  renderNestedTermList = (terms = this.state.my_terms) => {
    console.log("Dans renderNestedTermList");
    console.log("Card modifiée : ", this.editedCard);
    console.log("Indexes de la card : ", this.editedCardIndexes);
    if (this.editedCard) {
      return (
        <>
          <hr />
          <ul className="list-group list-group-terms">
            {terms.map(term => {
              return term.name === this.editedCard.name ? (
                ""
              ) : (
                <li
                  key={term.id}
                  title={`Cliquer pour copier la card en cours vers la rubrique ${term.name}`}
                  className="list-group-item"
                  onClick={e =>
                    this.handleClickCopyCard(e, this.editedCard, term)
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
  handleChangeFilterByName = (e) => {
    console.log('Dans handleChangeFilterByName, name : ', e.target.value);
    const state = { ... this.state };
    if (e.target.value) state.filter_name = e.target.value;
    else state.filter_name = "";
    this.setState(state);
  }
  handleSubmitFilterByName = (e) => {
    e.preventDefault();
    console.log('Dans handleSubmitFilterByName');

    const user_id = document.getElementById("ul-users-button").querySelector("li > button").getAttribute("id");
    const user_index = this.state.users.findIndex(user => {
      return user.id === user_id;
    });
    const user = this.state.users[user_index];
    console.log('user_id : ', user_id);
    console.log('user : ', user);

    this.handleClickName(e, user);

  }
  renderUsers = () => {
    console.log('Dans renderUsers');

    if (!this.state.show_users && this.state.other_user) {
      return (
        <div className="d-flex justify-content-center">
          <button
            onClick={this.handleClickShowUsers}
            className="btn btn-primary">
            <FiUserPlus className="m-2 h4" />
            Voir les autres utilisateurs

          </button>
        </div>
      )
    } else {
      return (
        <section>
          {this.state.other_user && (
            <div className="d-flex justify-content-center">
              <button
                onClick={this.handleClickHideUsers}
                className="btn btn-primary">
                <FiUserMinus className="m-2 h4" />
                Cacher les utilisateurs
              </button>
            </div>
          )}
          <div className="title-form-others mt-4 mb-4 d-flex align-items-center">
            <h2 className='me-4'>Les autres utilisateurs</h2>
            <form
              onSubmit={this.handleSubmitFilterByName}>
              <label htmlFor="filter-name">Filtrer par nom &nbsp; &nbsp;</label>
              <input type="text"
                id="filter-name"
                onChange={this.handleChangeFilterByName}
                value={this.state.filter_name}
                autoFocus
              />

            </form>
          </div>

          <ul className="list-unstyled d-flex flex-wrap" id="ul-users-button">
            {
              this.state.users
                .filter(user => {
                  if (this.state.filter_name) return user.name.match(new RegExp(this.state.filter_name, 'i')) && user.id !== this.state.coopernet.user.id && user.id !== "0"
                  else return user.id !== this.state.coopernet.user.id && user.id !== "0"
                })
                .map(user => <li
                  onClick={(e) => { this.handleClickName(e, user) }}
                  className="col col-md-2 "
                  key={user.id}>
                  <button className="btn btn-secondary m-2 w-100" id={user.id}>{user.name}</button>
                </li>)}
          </ul>

          {this.state.other_user && (
            <div className="d-flex justify-content-center">
              <button
                onClick={this.handleClickHideUsers}
                className="btn btn-primary">
                <FiUserMinus className="m-2 h4" />
                Cacher les utilisateurs

              </button>
            </div>
          )}
        </section>
      );
    }
  }
  /**
   * Affichage des termes dans un menu */
  renderTerms = () => {
    //console.log("Dans renderTerms");
    //console.log("this ", this);
    if (this.state.userIsLogged && this.state.terms.length) {
      return (

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
      );
    }
  };
  render() {
    return (
      <div>
        <main className="container">
          {!this.state.userIsLogged && (<Navigate to="/" />)}

          <div className="row">
            <div className="col others-users-div">
              {!!this.state.users.length && (this.renderUsers())}
            </div>
          </div>
          <div className="row">
            <div className="col">
              <h2> {this.state.other_user ? 'Les tableaux de ' + this.state.other_user.name : ''}</h2>
            </div>
          </div>
          <div className="row">
            <div className="col">
              {this.renderFormMovingCard()}
              <div id="section-terms">
                {this.renderTerms()}
              </div>
            </div>
          </div><div className="row">
            <div className="col">
              <div >
                {this.renderColumn()}
              </div>
            </div>
          </div>
        </main>

      </div>
    );
  }
}

export default OthersTables;