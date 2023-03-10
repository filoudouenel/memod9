import React, { Component } from "react";
import Modal from "react-bootstrap/Modal";
import Button from "react-bootstrap/Button";
class Term extends Component {
  state = {
    open_parameter: false
  };
  handleCloseModal = () => {
    console.log("dans handleCloseModal");
    const state = { ...this.state };
    state.open_parameter = false;

    this.setState(state);
  };
  switchOpenParameter = () => {
    console.log("dans switchOpenParameter");
    const state = { ...this.state };
    state.open_parameter = state.open_parameter ? false : true;

    this.setState(state);
  };
  dumpTermAsLink = (selected, indexes) => {
    //console.log("Term name dans dumpTermAsLink, ", this.props.term.name);
    const subterm_size = (this.props.term.hasOwnProperty("children"))
      ? " >"
      : "";
    const has_subterm = (subterm_size) ? true : false;
    let classes = (this.props.term.hasOwnProperty("selected") && this.props.term.selected)
      ? "btn-warning"
      : "btn-secondary";
    return (
      <div className={`d-flex btn m-2 ${classes}`}>
        <a
          href="."
          className="pr-3"
          onClick={e => {
            e.preventDefault();
            this.props.onClickDropdownToggle(e,
              this.props.term.id,
              this.props.indexes,
              this.props.term.name,
              has_subterm);
          }}

          id={this.props.term.id}
        >
          {this.props.term.name}
          <span
            className="content"
            dangerouslySetInnerHTML={{ __html: subterm_size }}
          ></span>
        </a>
      </div>
    );
  };
  dumpTermModal = (indexes) => {
    //console.log("Dans dumpTermModal. Indexes : ", indexes);
    if (this.state.open_parameter) {
      const nb_cards = document.querySelectorAll("article.card").length;
      return (
        <Modal
          show={this.state.open_parameter}
          size="lg"
          className="modal-large"
          onHide={this.handleCloseModal}
        >
          <Modal.Header>
            <Modal.Title>
              Gestion du terme
              <span className="ml-1 alert alert-secondary" role="alert">
                {this.props.term.name}
              </span>
            </Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <div className="parameter-div">

              {(nb_cards > 0) && (
                <span className="ml-2 alert alert-warning">
                  suppression impossible tant que des cards sont attach??es ?? ce
                  terme.
                </span>
              )}
              <h3>Modification du terme</h3>
              <form
                id="edit-term"
                onSubmit={e => {
                  e.preventDefault();
                  console.log("this.props.term : ", this.props.term);
                  this.switchOpenParameter();
                  this.props.onChangeTerm(e, this.props.term, 0, indexes);
                }}
                className={"d-flex align-items-center flex-wrap " +
                  (this.props.submenu ? "submenu" : "")}
              >
                <label className="label-login-form  ">
                  <input
                    id="edit-term-value"
                    name="edit-term-name"
                    type="text"
                    className="validate m-2"
                    defaultValue={this.props.term.name}
                  />
                </label>
                <input type="submit" value="Envoyer" className="mb-2" />
              </form>
              <h3>Placer ce terme en tant que fils de :</h3>

              {this.dumpNestedTermList(this.props.terms, indexes, true)}
            </div>
          </Modal.Body>
          <Modal.Footer>
            <button
              className="btn btn-danger"
              onClick={e => {
                this.props.onDeleteTerm(e, this.props.term, nb_cards);
              }}
            >
              Supprimer
              </button>
            <Button variant="primary" onClick={e => this.switchOpenParameter()}>
              Fermer
            </Button>
          </Modal.Footer>
        </Modal>
      );
    }
  };
  /**
   * Affichage des termes sous forme de liste afin de pouvoir
   * s??lectionner le parent d'un terme
* @param  {} terms
* @param  {} indexes
           */
  dumpNestedTermList = (terms, indexes, root = false) => {
    return (
      <ul className="list-group list-group-terms">
        {(root) && (
          <li
            onClick={e =>
              this.props.onChangeTerm(e, this.props.term, -1, indexes)
            }
            title="Cliquer pour d??placer la rubrique vers la racine"
            className="list-group-item">/
          </li>)
        }

        {terms.map(term => {
          return term.name === this.props.term.name ? (
            ""
          ) : (
              <li
                key={term.id}
                title={`Cliquer pour d??placer la rubrique en cours vers ${term.name}`}
                className="list-group-item"
                onClick={e =>
                  this.props.onChangeTerm(e, this.props.term, term.id, indexes)
                }
              >
                {term.name}
                {term.hasOwnProperty("children") && this.dumpNestedTermList(term.children, indexes)}
              </li>
            );
        })}
      </ul>
    );
  }
  render() {
    return (
      <React.Fragment>
        <div className="term-div">

          {this.dumpTermAsLink(this.props.term.selected, this.props.indexes)}
          {this.dumpTermModal(this.props.indexes)}
        </div>
      </React.Fragment>
    );
  }
}

export default Term;
