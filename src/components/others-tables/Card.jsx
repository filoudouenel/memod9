import React, { Component } from "react";
import Modal from "react-bootstrap/Modal";
import Button from "react-bootstrap/Button";
import Diff from "./Diff";

class Card extends Component {
  state = {
    suggesting_a_answer: false,
    suggested_answer: "",
    card_pronounciation: null
  };
  vc = null;
  changeStateSuggestionAAnswer = e => {
    console.log("dans changeStateSuggestionAAnswer");
    const state = { ...this.state };
    state.suggesting_a_answer = true;
    this.setState(state);
  };
  handleCloseForm = event => {
    console.log("dans handleCloseForm");
    const state = { ...this.state };
    state.suggesting_a_answer = false;
    state.suggested_answer = "";
    this.setState(state);
  };
  handleSubmitSuggestAnswer = event => {
    console.log("dans handleSubmitSuggestAnswer");
    event.preventDefault();
    const state = { ...this.state };
    state.suggested_answer = document.querySelector(
      "#inputsuggestanswer"
    ).value;
    this.setState(state);
  };
  handleLoadFormSuggestAnswer = event => {
    console.log("dans handleLoadFormSuggestAnswer");
  };
  dumpCompareAnswer = () => {
    if (this.state.suggested_answer !== "") {
      if (this.props.card.answer === this.state.suggested_answer) {
        return (
          <div className="alert-success mt-3 mb-3 p-2">Réponse parfaite !</div>
        );
      } else
        return (
          <div>
            <Diff
              ancien={this.props.card.answer}
              nouveau={this.state.suggested_answer}
              splitView={true}
            />
          </div>
        );
    }
  };
  dumpFormAnswerSuggest = event => {
    console.log("dans dumpFormAnswerSuggest");

    if (this.state.suggesting_a_answer) {
      window.setTimeout(function () {
        const input_suggest_answer = document.querySelector(
          "#inputsuggestanswer"
        );
        if (input_suggest_answer) input_suggest_answer.focus();
      }, 500);
      return (
        <Modal show={true} size="lg" className="modal-large">
          <Modal.Header>
            <Modal.Title className="mb-4">Proposer une réponse</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <h4 className="card-question">{this.props.card.question}</h4>
            {/* formulaire ici */}
            <form
              id="suggest-answer"
              onSubmit={e => {
                this.handleSubmitSuggestAnswer(e);
              }}
            >
              <div id="div-answer" className="div-label-form">
                <label className="w-100">
                  <div>Réponse :</div>

                  <textarea
                    type="text"
                    autoFocus
                    className="w-100"
                    id="inputsuggestanswer"
                  />
                </label>
              </div>

              <button
                type="submit"
                className="btn btn-default btn-danger button-normal-size"
              >
                Comparer
              </button>
            </form>
            {this.dumpCompareAnswer()}
          </Modal.Body>
          <Modal.Footer>
            <Button variant="primary" onClick={e => this.handleCloseForm()}>
              Fermer
            </Button>
          </Modal.Footer>
        </Modal>
      );
    }
  };
  getSelectedWord = () => {
    console.log("dans getSelectedWord");
    let text = "";
    if (window.getSelection) {
      text = window.getSelection().toString();
    } else if (document.selection && document.selection.type !== "Control") {
      text = document.selection.createRange().text;
    }
    return text;
  };

  renderCardClass = (card_id) => {
    console.log('Dans renderCardClass.');
    const copied_cards = this.props.copied_cards;
    console.log('Copied_card : ', copied_cards, 'card_id : ', card_id);
    if (copied_cards.length) {
      if (copied_cards.indexOf(+ card_id) !== -1) {
        return 'copied';
      }
    }
    else return "";
  }
  render() {
    return (
      <article
        className={`${this.renderCardClass(this.props.card.id)} bg-secondary text-light p-2 mb-2 mt-4 rounded card`}
        id={this.props.card.id}
      >
        <h4
          className="card-question pl-50"
          title="Voir la réponse"
          onClick={e => {
            this.props.onShowAnswer(e, this.props.card, this.props.column);
          }}
        >
          {this.props.card.question}
        </h4>
        <div className="text-center d-flex justify-content-around align-items-center">
          <button
            className="btn mb-2 mt-2 btn-warning"
            onClick={e => this.changeStateSuggestionAAnswer(e)}
          >
            Proposer une réponse
          </button>
          {/* icon des paramètre (engrenage) */}
          <svg
            onClick={e => {
              this.props.onClickEditCard(
                e,
                this.props.card,
                this.props.column,
                this.props.col_index,
                this.props.card_index
              );
            }}
            className="icon"
            stroke="currentColor"
            fill="currentColor"
            strokeWidth="0"
            viewBox="0 0 14 16"
            height="2rem"
            width="2rem"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M14 8.77v-1.6l-1.94-.64-.45-1.09.88-1.84-1.13-1.13-1.81.91-1.09-.45-.69-1.92h-1.6l-.63 1.94-1.11.45-1.84-.88-1.13 1.13.91 1.81-.45 1.09L0 7.23v1.59l1.94.64.45 1.09-.88 1.84 1.13 1.13 1.81-.91 1.09.45.69 1.92h1.59l.63-1.94 1.11-.45 1.84.88 1.13-1.13-.92-1.81.47-1.09L14 8.75v.02zM7 11c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3z"></path>
          </svg>
        </div>

        {this.props.show_answer && (
          <div>
            <h3 className="panel-footer answer border-left border-success m-2 p-2">
              {this.props.answer_html && <div>this.props.card.answer</div>}
              {!this.props.answer_html && this.props.card.answer}
            </h3>
            <div
              className="content info-answer mb-4 ml-2"
              dangerouslySetInnerHTML={{ __html: this.props.card.explanation }}
            ></div>


          </div>
        )}
        {this.dumpFormAnswerSuggest()}
      </article>
    );
  }
}

export default Card;