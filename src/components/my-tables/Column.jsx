import React, { Component } from "react";
import Card from "./Card";

class Column extends Component {
  state = {};
  render() {
    return (
      <section className="section-card mt-4">
        <h3>
          <button
            type="button"
            title="Ajouter une card"
            className="btn btn-success left"
            onClick={() => {
              this.props.onClickAddCard(this.props.id);
            }}
          >
            +
          </button>
          {this.props.label}
        </h3>
        {this.props.cards.map((card, index) => {
          return (
            <Card
              key={card.id}
              card={card}
              column={this.props.column}
              onShowAnswer={this.props.onShowAnswer}
              onMoveCard={this.props.onMoveCard}
              onClickEditCard={this.props.onClickEditCard}
              show_answer={card.show_answer}
              user={this.props.user}
              col_index={this.props.col_index}
              card_index={index}
              coopernet={this.props.coopernet}
              admin_mode={this.props.admin_mode}
            />
          );
        })}
      </section>
    );
  }
}

export default Column;
