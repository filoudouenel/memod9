import React, { Component } from "react";
import Term from "./Term";
/**
 * L'idée générale de cette classe est de créer des listes de liens imbriquées
 * avec la gestion de l'événement click sur les liens.
 * Cet événement transmet les index de la liste imbriqués afin que la propriété
 * "selected" soit modifiée
 */
class NestedDropdown extends Component {
  /**
   * Permet de récupérer les classes pour les différents termes
   * Les termes de "premier niveau" sont un cas à part car on doit
   * savoir s'ils sont open ou close...
   */
  dumpMenuClass = (selected, children, first_level = false) => {
    let menu_class = "";
    menu_class = selected ? "selected" : "not-selected";
    menu_class +=
      children && children.length ? " has-children" : " no-children";
    menu_class +=
      (first_level && this.props.term.hasOwnProperty("open") && this.props.term.open) ? " open" : " closed";
    return menu_class;
  };
  /**
   * Affiche les termes de niveau 1 et va chercher ensuite les
   * autres niveaux grâce à la fonction renderSubMenu
   */
  renderDisplay = () => {
    //console.log("dans renderDisplay");

    let indexes = [this.props.index];
    return (
      <li
        key={this.props.term.id}
        className={this.dumpMenuClass(this.props.term.selected, this.props.term.children, true)}
      >
        <Term
          onClickDropdownToggle={this.props.onClickDropdownToggle}
          term={this.props.term}
          terms={this.props.terms}
          indexes={indexes}
          onChangeTerm={this.props.onChangeTerm}
          onDeleteTerm={this.props.onDeleteTerm}
          submenu={false}
          admin_mode={this.props.admin_mode}
        />

        {this.renderSubMenu(this.props.term.children, this.props.index, 1, indexes)}
      </li>
    );
  };

  /**
   * L'idée est de bien tenir à jour "indexes" en fonction des cas de figure
   * soit on a cliqué sur un terme de profondeur (depth) encore non atteinte et on ajoute à indexes
   * soit on est au même niveau et on modifie le niveau en cours
   * soit on est en dessous et on supprime les niveaux supérieur et on met à jour
   * le niveau en cours
   */
  renderSubMenu = (children, index, depth, indexes) => {
    //console.log("xxxxxxxxxxxxxxxxxxxxxxxdans renderSubMenu", indexes);
    if (children !== undefined) {
      return (
        <ul>
          {children.map((term, i) => {
            //indexes.push(i);
            const copy_indexes = [...indexes];
            copy_indexes.push(i);
            let submenu =
              term.children !== undefined
                ? this.renderSubMenu(term.children, i, depth + 1, copy_indexes)
                : undefined;

            return (
              <li
                key={term.id}
                id={`${term.id}-${term.selected}`}
                className={this.dumpMenuClass(term.selected, term.children)}
              >
                <Term
                  onClickDropdownToggle={this.props.onClickDropdownToggle}
                  term={term}
                  terms={this.props.terms}
                  indexes={copy_indexes}
                  onChangeTerm={this.props.onChangeTerm}
                  onDeleteTerm={this.props.onDeleteTerm}
                  submenu={true}
                  admin_mode={this.props.admin_mode}
                />
                {submenu}
              </li>
            );
          })}
        </ul>
      );
    }
  };
  render() {
    return (
      <>{this.renderDisplay()}</>
    );
  }
}
export default NestedDropdown;
