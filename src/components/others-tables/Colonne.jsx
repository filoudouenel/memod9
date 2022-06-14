import React, { Component } from "react";
import Carte from "./Carte";

class Colonne extends Component {
  state = {};
  render() {
    return (
      <section className="section-card mt-4">
        <h3>
          {this.props.label}
        </h3>
        {this.props.cards.map((card, index) => {
          return (
            <Carte
              key={card.id}
              card={card}
              colonne={this.props.colonne}
              onShowReponse={this.props.onShowReponse}
              onMoveCard={this.props.onMoveCard}
              onClickEditCard={this.props.onClickEditCard}
              show_reponse={card.show_reponse}
              user={this.props.user}
              col_index={this.props.col_index}
              card_index={index}
              copied_cards={this.props.copied_cards}
            />
          );
        })}
      </section>
    );
  }
}

export default Colonne;
