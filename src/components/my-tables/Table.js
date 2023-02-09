import React, {Component} from "react";
import NestedDropdown from "./NestedDropdown";
import Column from "./Column";
import Modal from "react-bootstrap/Modal";
import Button from "react-bootstrap/Button";
import {Navigate} from "react-router-dom";
import {AiOutlineClose} from "react-icons/ai";
import Coopernet from "../../services/Coopernet";
import HomeTableTerms from "../HomeTableTerms";

class Table extends Component {
    constructor(props) {
        //console.log("dans le constructeur de tableaux");

        super(props);
        this.state = {
            userIsLogged: this.props.userIsLogged,
            addingACard: false,
            editingACard: false,
            addingATerm: false,
            msgError: "",
            terms: [],
            columns: [], //ici sont stockées les columns et les cards
            need_get_terms: true,
            term_name: "",
        };
        this.render_modal_add_edit_card = true;
        this.themeId = 0;
        this.columnId = 0;
        this.editedCard = null;
        this.editedColumn = null;
        this.editedCardIndexes = null;
        this.timeoutChangeTermID = null;
    }

    async componentDidMount() {
        try {
            // création de la requête pour obtenir les thématiques
            console.log('Dans componentDidMount de Table : ', Coopernet);
            const terms = await Coopernet.getTerms();
            const state = {...this.state};
            state.terms = terms;
            state.termsAndCols = await Coopernet.toArrayTermsAndCol();
            this.setState(state);
        } catch (error) {
            console.error(`Erreur attrapée dans componentDidMount de Table à l'appel de getTerms ` + error);
        }
    }

    /**
     * Récupère l'index de la column actuelle puis l'index de la column
     * précédente ou suivante puis récupère l'index du term de tanonomie
     * pour le donner en paramètre à la fonction qui est chargée de modifier
     * la card
     */
    moveCard = (card, column, direction) => {
        console.log("Dans moveCard");
        console.log(card, column, direction, this.themeId);

        // récupération de l'index de la column
        const current_column_index = this.state.columns.indexOf(column);
        console.log("index de la column : ", current_column_index);
        let new_index_drupal_column = 0;

        switch (direction) {
            case "right":
                // récupération de l'index suivant
                const next_column_index = (current_column_index + 1) % 4;
                console.log("index suivant : ", next_column_index);
                new_index_drupal_column = this.state.columns[next_column_index].id;
                break;
            case "left":
                // récupération de l'index précédent
                let previous_column_index = (current_column_index - 1) % 4;
                previous_column_index = previous_column_index === -1 ? 3 : previous_column_index;
                console.log("index précédent : ", previous_column_index);
                new_index_drupal_column = this.state.columns[previous_column_index].id;
                break;
            default:
                console.log("Pb dans moveCard " + direction + ".");
        }
        console.log("nouvel index de la card : ", new_index_drupal_column);
        Coopernet.createReqEditColumnCard(card.id, new_index_drupal_column, this.themeId, this.successEditColumnCard, this.failedEditColumnCard);
    };

    successEditColumnCard = async themeid => {
        console.log("Dans successEditColumnCard");
        try {
            // Rappel de la fonction qui va chercher la liste des cards pour une thématique
            const columns = await Coopernet.getCards(themeid);
            const state = {...this.state};
            state.columns = columns;
            this.setState(state);
        } catch (error) {
            console.error(`Exception attrappée dans successEditColumnCard : `, error);
        }

    };
    failedEditColumnCard = () => {
        console.log("Dans failedEditColumnCard");
    };
    successEditCard = async (term_id, reload_current_term) => {
        console.log("#############Dans successEditCard - reload_current_term : ", reload_current_term);

        // Rappel de la fonction qui va chercher la liste des cards pour
        // une thématique. Si reload_current_term est vrai, on recharge
        // le terme en cours. C'est utile dans le cas d'un déplacement de card.
        term_id = (reload_current_term) ? this.themeId : term_id;

        try {
            const columns = await Coopernet.getCards(term_id);
            console.log(`columns : `, columns);
            const state = {...this.state};
            state.columns = columns;
            this.themeId = term_id;
            this.setState(state);
        } catch (error) {
            console.error("Erreur attrapée à l'appel de getCards dans handleClickDropdownToggle", error);
        }

    };

    failedEditCard = () => {
        console.log("Dans failedEditCard");
    };
    successAddCard = async term_id => {
        console.log("Dans successAddCard");
        // Rappel de la fonction qui va chercher la liste des cards pour une thématique
        try {
            const columns = await Coopernet.getCards(term_id);
            console.log(`columns : `, columns);
            const state = {...this.state};
            state.columns = columns;
            this.themeId = term_id;
            this.setState(state);
        } catch (error) {
            console.error("Erreur attrapée à l'appel de getCards dans handleClickDropdownToggle", error);
        }
    };
    failedAddCard = () => {
        console.log("Dans failedAddCard");
    };
    successAddOrEditTerm = async (tid, action_type) => {
        console.log("Dans successAddOrEditTerm - Action : " + action_type + " sur tid : " + tid);
        const state = {...this.state};
        state.addingATerm = false;
        this.setState(state);

        // récupération de l'index du terme concerné pour changer la propriété "selected"
        let term_index = state.terms.findIndex(element => {
            return element.id === tid;
        });
        try {
            // création de la requête pour obtenir les thématiques
            const terms = await Coopernet.getTerms();
            state.terms = terms;

        } catch (error) {
            console.error(`Erreur catchée dans successAddOrEditTerm lors de l'appel de getTerms`);
        }

        if (action_type !== "added") state.terms[term_index].selected = true;

        this.setState(state);
        // création de la requête pour obtenir les cards correspondantes à la thématique
        /* if (action_type === "added") this.state.coopernet.createReqCards(
          tid,
          this.successGetCards,
          this.failedCards,
          -1
        ); */
    };
    failedAddOrEditTerm = () => {
        console.log("Dans failedAddOrEditTerm");
    };
    /**
     * Suppression d'une carte après confirmation
     * @param {Number} card_id
     */
    removeCard = async (card_id) => {
        if (window.confirm('Etes vous sûr.e de vouloir supprimer cette carte ?')) {
            try {
                await Coopernet.removeCard(card_id);
                console.log("removeCard OK. Carte n° " + card_id);
                // On enlève la fenêtre modal de suppression/modification
                this.render_modal_add_edit_card = false;
                // Attention pour que l'ajout d'une card soit à nouveau possible,
                // il faut réinitialiser les propriétés editingACard et addingACard
                const state = {...this.state};
                state.editingACard = false;
                state.addingACard = false;
                state.columns[this.editedCardIndexes[0]].cards.splice(this.editedCardIndexes[1], 1);
                this.setState(state);
            } catch (error) {
                console.error(`Erreur catchée dans removeCard de Table.js` + error);
            }
        } else {
            // Do nothing!
            console.log('Carte non supprimée.');
        }

    }

    handleSubmitAddOrEditCard = (event, editedCard = false, new_term = null) => {
        console.log("dans handleSubmitAddOrEditCard - card modifiée = ", editedCard);

        event.preventDefault();
        // récupération des éléments du formulaire
        const new_card = {
            question: document.getElementById("inputquestion").value.trim(),
            answer: document.getElementById("inputanswer").value.trim(),
            explanation: document.getElementById("inputexplanation").value,
            question_picture: {
                data: document.getElementById("inputquestionpicture"),
                url: document.getElementById("inputquestionpicture").value
            },
            explanation_picture: {
                data: document.getElementById("inputexplanationpicture"),
                url: document.getElementById("inputexplanationpicture").value
            },
            column: this.numCol
        }

        // Ajout d'une card si editedCard est faux
        if (!editedCard) {
            Coopernet.createReqAddCards(new_card, this.themeId, this.successAddCard, this.failedAddCard);
        } else {
            // Modification de la card si editedCard est une card
            console.log("dans handleSubmitAddOrEditCard : appel de createReqEditCard");
            // Permet de gérer le changement de Terme d'une Card
            const themeId = (new_term) ? new_term.id : this.themeId;
            const reload_current_term = !!new_term;
            // si changement de term pour la card, on rafraîchit le term name

            // arguments num_card,login,pwd,question,answer,themeid,columnid,callbackSuccess,callbackFailed
            /* console.log("num_card = ", editedCard.id);
            console.log("login = ", this.state.coopernet.user.name);
            console.log("question = ", editedCard.question);
            console.log("answer = ", editedCard.answer);
            console.log("explanation = ", editedCard.explanation);
            console.log("themeid = ", themeId);
            console.log("columnid = ", editedCard.column); */

            // Suppression des espaces en début et en fin de chaîne de caractères
            editedCard.question = editedCard.question.trim();
            editedCard.answer = editedCard.answer.trim();
            if(document.getElementById("cbdeleteimagequestion") && document.getElementById("cbdeleteimagequestion").checked){
                editedCard.question_picture = {delete: document.getElementById("cbdeleteimagequestion").checked}
            }
            if(document.getElementById("cbdeleteimageexplanation") && document.getElementById("cbdeleteimageexplanation").checked){
                editedCard.explanation_picture = {delete: document.getElementById("cbdeleteimageexplanation").checked}
            }
            if (document.getElementById("inputquestionpicture").value) editedCard.question_picture = {
                data: document.getElementById("inputquestionpicture"),
                url: document.getElementById("inputquestionpicture").value
            };
            if (document.getElementById("inputexplanationpicture").value) editedCard.explanation_picture = {
                data: document.getElementById("inputexplanationpicture"),
                url: document.getElementById("inputexplanationpicture").value
            };
            Coopernet.createReqEditCard(editedCard, themeId, editedCard.column, this.successEditCard, this.failedEditCard, reload_current_term);

            //Suppression de la carte dans le state si on a cliqué sur un terme différent
            if (new_term && new_term.name !== this.state.term_name) {
                const prevState = {...this.state};
                const columnIndex = prevState.columns.findIndex(column => column.id == editedCard.column);
                const cardIndex = prevState.columns[columnIndex].cards.findIndex(card => card.id == editedCard.id);
                prevState.columns[columnIndex].cards.splice(cardIndex, 1);
                this.setState(prevState);
            }

        }

        const state = {...this.state};
        state.addingACard = false;
        state.editingACard = false;
        this.editedCard = null;
        this.editedColumn = null;
        this.editedCardIndexes = null;
        this.setState(state);
    };
    handleCloseForm = event => {
        console.log("dans handleCloseForm");
        const state = {...this.state};
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
    handleClickDropdownToggle = async (e, term_id, indexes, term_name, has_subterm) => {
        console.log("dans handleClickDropdownToggle");
        console.log("chemin du terme clické : ", indexes);
        console.log("profondeur : ", indexes.length);
        console.log("State des terms : ", this.state.terms);
        console.log("has_subterm : ", has_subterm);

        e.preventDefault();
        const state = {...this.state};

        // si on a cliqué sur un niveau 1 qui était "selected" et "close" alors
        // on ne va pas chercher les cards correspondantes et on se contente
        // de passer le terme de nivau 0 à "open"
        if ((indexes.length === 1) && state.terms[indexes[0]].selected && !state.terms[indexes[0]].open) {
            // on passe le terme de nivau 0 à "open"
            console.log("#############################cas 1 - on ouvre une rubrique qui a des sous-rubriques");
            state.terms[indexes[0]].open = true;
            this.setState(state);
        } else if ((indexes.length === 1) && state.terms[indexes[0]].open) {
            console.log("############################# cas 2 on clique sur une rubrique de niveau 1 qui est déjà ouverte");

            this.browseTreeToManageSelected(state.terms, indexes);
            console.log(`Appel de getCards 1`);
            state.terms[indexes[0]].open = false;
            this.setState(state);

        } else {
            console.log("#############################cas 3. On clique sur un terme pour afficher les cartes correspondantes ", term_name, " - hassubterm : ", has_subterm);
            // on gère l'état des terms (selected, open) grâce à une fonction récursive
            // à laquelle on passe par référence state.terms
            this.browseTreeToManageSelected(state.terms, indexes);
            try {
                const columns = await Coopernet.getCards(term_id);
                console.log(`columns : `, columns);
                state.columns = columns;
                state.term_name = term_name;
                this.themeId = term_id;
                this.setState(state);
                //this.successGetCards(this.state.columns, term_id, 0, term_name, has_subterm);
            } catch (error) {
                console.error("Erreur attrapée à l'appel de getCards dans handleClickDropdownToggle", error);
            }

        }
    };
    /**
     * @param  {array} cols
     * @param  {number} termId
     * @param  {number} depth
     * @param  {string} term_name
     * @param  {boolean} has_subterm
     */
    successGetCards = (cols, termId, depth, term_name, has_subterm) => {
        console.log("Dans successGetCards pour le term : ", term_name, " has_subterm : ", has_subterm, "columns : ", cols);
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
        if ((!(depth === 1 && !term_has_cards && has_subterm)) || (depth === 1 && term_has_cards)) {

            cols.sort((a, b) => a.id - b.id);
            console.log("Columns : ", cols);
            const state = {...this.state};
            state.columns = cols;

            // on sait maintenant quel term (thématique) est affiché
            this.themeId = termId;
            state.term_name = term_name;
            this.setState(state);
        }

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
                if (depth === 0 && term.selected && term.hasOwnProperty("open") && term.open && indexes.length === 1) {
                    //term.selected = false;
                    console.log("Deuxième condition");
                    term.open = false;
                } else {
                    //console.log("Troisième condition");
                    term.selected = true;
                    term.open = true;
                }
            } else if (i.toString() === indexes[depth]) {
                //console.log("cas où l'index correspond à celui du terme cliqué", term.name);
                term.selected = true;
                term.open = true;
            } else {
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
            return (<Modal
                show={true}
                onHide={this.handleCloseForm}
                size="lg"
                className="modal-large"
            >
                <Modal.Header className="d-flex justify-content-between">
                    <Modal.Title>Gérer la card</Modal.Title>
                    <AiOutlineClose className="icon-click"
                                    onClick={e => this.handleCloseForm()}
                    />
                </Modal.Header>
                <Modal.Body>
                    {<>
                        {/* formulaire ici */}
                        <h3>Modification de la card</h3>
                        <form
                            id="add-or-edit-card"
                            onSubmit={e => {
                                this.handleSubmitAddOrEditCard(e, edit);
                            }}
                        >
                            <div id="div-question" className="div-label-form">
                                <label className="label-large">
                                    <div>Question :</div>
                                    {this.state.addingACard && (<input
                                        type="text"
                                        id="inputquestion"
                                        autoFocus
                                        className="ml-4 input-large"
                                    />)}
                                    {this.state.editingACard && (<input
                                        onChange={e => this.handleChangeCard(e, this.editedCard)}
                                        type="text"
                                        id="inputquestion"
                                        autoFocus
                                        className="ml-4 input-large"
                                        value={this.editedCard.question}
                                    />)}
                                </label>
                                <label>
                                    {this.state.editingACard && this.editedCard.question_picture?.url && (
                                        <div className='divDeleteImage'>
                                            <p>Supprimer l'ancienne image ? <img alt="" src={Coopernet.url_server + this.editedCard.question_picture.url}/></p>
                                            <input className='ms-2' type="checkbox" id="cbdeleteimagequestion"/>
                                        </div>
                                    )}
                                </label>
                                <label className="mt-2">
                                    <p>Image question : </p>
                                    <input className='ms-2' type="file" id={'inputquestionpicture'}/>
                                </label>
                            </div>
                            <div id="div-answer" className="div-label-form">
                                <label className="label-large">
                                    <div>Réponse :</div>
                                    {this.state.addingACard && (<textarea
                                        type="text"
                                        autoFocus
                                        className="ml-4 textarea-large"
                                        id="inputanswer"
                                    />)}
                                    {this.state.editingACard && (<textarea
                                        onChange={e => this.handleChangeCard(e, this.editedCard)}
                                        type="text"
                                        autoFocus
                                        className="ml-4 textarea-large"
                                        id="inputanswer"
                                        value={this.editedCard.answer}
                                    />)}
                                </label>
                            </div>
                            <div id="div-explanation" className="div-label-form">
                                <label className="label-large">
                                    <div>Explication :</div>
                                    {this.state.addingACard && (<textarea
                                        type="text"
                                        autoFocus
                                        className="ml-4 textarea-large"
                                        id="inputexplanation"
                                    />)}
                                    {this.state.editingACard && (<textarea
                                        onChange={e => this.handleChangeCard(e, this.editedCard)}
                                        type="text"
                                        autoFocus
                                        className="ml-4 textarea-large"
                                        id="inputexplanation"
                                        value={this.editedCard.explanation}
                                    />)}
                                </label>
                                <label>
                                    {this.state.editingACard && this.editedCard.explanation_picture?.url && (
                                        <div className='divDeleteImage'>
                                            <p>Supprimer l'ancienne image ? <img alt="" src={Coopernet.url_server + this.editedCard.explanation_picture.url}/></p>
                                            <input className='ms-2' type="checkbox" id="cbdeleteimageexplanation"/>
                                        </div>
                                    )}
                                </label>
                                <label className="mt-2">
                                    <p>Image explication : </p>
                                    <input className='ms-2' type="file" id={'inputexplanationpicture'}/>
                                </label>
                            </div>
                            <button
                                type="submit"
                                className="btn btn-default btn-success button-normal-size"
                            >
                                Envoyer
                            </button>
                        </form>
                    </>}
                    {this.state.editingACard && (this.renderNestedTermList())}
                </Modal.Body>
                <Modal.Footer>
                    {(this.editedCard !== null && this.state.editingACard) && (<Button
                        variant="warning"
                        onClick={() => this.removeCard(this.editedCard.id)}
                        className="ml-4 bg-danger text-light ">
                        Supprimer la carte
                    </Button>)}
                </Modal.Footer>
            </Modal>);
        } else return "";
    };
    handleChangeCard = (event, card) => {
        console.log("Dans handleChangeCard");
        event.preventDefault();

        let state = {...this.state};

        // Récupération des champs modifiés via le formulaire
        let question = document.getElementById("inputquestion").value;
        let answer = document.getElementById("inputanswer").value;
        let explanation = document.getElementById("inputexplanation").value;

        // récupération de l'index des columns
        let index_columns = state.columns.indexOf(this.editedColumn);
        // récupération de l'index des cards
        let index_cards = state.columns[index_columns].cards.indexOf(card);

        state.columns[index_columns].cards[index_cards].question = question;
        state.columns[index_columns].cards[index_cards].answer = answer;
        state.columns[index_columns].cards[index_cards].explanation = explanation;
        this.setState(state);
    };
    handleChangeTerm = (event, term, tid_parent, indexes) => {
        console.log("Dans handleChangeTerm - Term modifié : ", term);
        event.preventDefault();
        let state = {...this.state};
        let tid = term.id;

        // récupération de l'index du term
        let index_term = state.terms.indexOf(term);
        console.log("index_term : ", index_term);

        // on veut placer ce terme en tant que fils de
        if (tid_parent) {
            console.log("le parent du term", term, "sera : ", tid_parent);
            Coopernet.createReqAddOrEditTerm(term.name, tid, this.successAddOrEditTerm, this.failedAddOrEditTerm, tid_parent);
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
                } else if (i === (indexes.length - 1)) {
                    current_term = current_term.children[indexes[i]];
                    current_term.name = term_name;
                } else {
                    current_term = current_term.children[indexes[i]];
                }
            }
            //state.terms[index_term].name = term_name;
            this.setState(state);
            // Enregistrement si la rubrique n'est ni vide ni un nombre
            if (term_name && isNaN(term_name)) {
                Coopernet.createReqAddOrEditTerm(term_name, tid, this.successAddOrEditTerm, this.failedAddOrEditTerm);
            }
        }
    };
    handleDeleteTerm = async (event, term, nb_cards, term_indexes) => {
        console.log("Dans handleDeleteTerm, term_indexes: ", term, term_indexes);

        if (nb_cards) console.log("Vous devez d'abord effacer toutes les cards : ", nb_cards); else if (window.confirm('Etes vous sûr.e de vouloir supprimer ce terme ?')) {
            try {
                await Coopernet.removeTerm(term.id);
                // on supprime le terme en question dans l'interface puisque la suppression sur le serveur a fonctionné
                const state = {...this.state};
                console.log(`terms : `, state.terms);
                /*
                 */
                // ATTENTION :

                // solution la plus simple : appeler getTerms mais l'exécution est plus longue puisqu'il faut intéroger le serveur
                // création de la requête pour obtenir les thématiques
                const terms = await Coopernet.getTerms();
                state.terms = terms;
                state.columns = [];
                state.term_name = `Terme "${state.term_name}" supprimé`;
                this.setState(state);

                // Solution plus compliquée mais qui donnerait un résultat plus rapide :
                // si le terme est imbriqué, il faut retrouver les index concernés du tableau "terms"
                /* let children_table_to_delete = state.terms;
                if (term_indexes.length > 1) {
                  for (let i = 0; i < (term_indexes.length - 1); i++) {
                    children_table_to_delete = children_table_to_delete.children[i];
                  }
                }

                let term_index = term_indexes[term_indexes.length - 1];
                console.log(`children_table_to_delete `, children_table_to_delete);
                console.log(`term_index `, term_index);
                if (term_index !== -1) {
                  children_table_to_delete.splice(term_index, 1);
                  state.columns = [];
                  //this.setState(state);
                } */

            } catch (error) {
                console.error("Erreur attrapée a l'appel de removeTerm :", error);
            }

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

            // ATTENTION : ici on ne crée pas vraiment un terme mais on en ajoute un sur le serveur et on rafraîchit...
            Coopernet.createReqAddOrEditTerm(term_label, tid, this.successAddOrEditTerm, this.failedAddOrEditTerm);
        } else {
            console.log("input du term vide ou nombre");
            const state = {...this.state};
            state.addingATerm = false;
            this.setState(state);
        }
    };
    renderFormLogin = () => {
        //console.log("Dans formLogin");
        if (!this.state.userIsLogged) {
            return (<form id="login-form" onSubmit={this.handleSubmit}>
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
            </form>);
        } else return "";
    };
    renderFormAddOrEditTerm = () => {
        //console.log("Dans renderFormAddOrEditTerm");
        if (this.state.userIsLogged && this.state.addingATerm) {
            console.log("this.state.userIsLogged && this.state.addingATerm", this.state.userIsLogged, this.state.addingATerm);
            return (<form
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
            </form>);
        } else return "";
    };
    /**
     * Affichage des termes dans un menu */
    renderTerms = () => {
        //console.log("Dans renderTerms");
        //console.log("this ", this);
        if (this.state.userIsLogged) {
            return (<section id="section-terms">
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
                        {this.state.terms.map((term, index) => (<NestedDropdown
                            key={term.id}
                            term={term}
                            terms={this.state.terms}
                            onClickDropdownToggle={this.handleClickDropdownToggle}
                            index={index}
                            onChangeTerm={this.handleChangeTerm}
                            onDeleteTerm={this.handleDeleteTerm}
                            admin_mode={this.props.admin_mode}
                        />))}
                    </ul>
                </nav>
            </section>);
        }
    };
    /**
     * Affichage des termes sous forme de liste afin de pouvoir
     * changer de term une card
     */
    renderNestedTermList = (terms = this.state.terms) => {
        console.log("Dans renderNestedTermList");
        console.log("Card modifiée : ", this.editedCard);
        console.log("Indexes de la card : ", this.editedCardIndexes);
        if (this.editedCard) {
            return (<>
                <hr/>
                <h3 className="">Déplacer la card</h3>
                <ul className="list-group list-group-terms">
                    {terms.map(term => {
                        return term.name === this.editedCard.name ? ("") : (<li
                            key={term.id}
                            title={`Cliquer pour déplacer la card en cours vers la rubrique ${term.name}`}
                            className="list-group-item"
                            onClick={e => this.handleSubmitAddOrEditCard(e, this.editedCard, term)}
                        >
                            {term.name}
                            {term.hasOwnProperty("children") && this.renderNestedTermList(term.children, this.editedCardIndexes)}
                        </li>);
                    })}
                </ul>
            </>);
        }

    }
    renderDropdownButton = (terms_array, menu_class = "not-first") => {
        console.log("dans renderDropdownButton", terms_array);
        const m_class = "coop-menu " + menu_class;
        return (<ul className={m_class}>
            {(terms_array.length !== 0) && terms_array.map(term => {
                let submenu;
                if (term.hasOwnProperty("children") && term.children.length > 0) {
                    //console.log("xxxxxxxxxxxxxxxxx appel récursif : ", term.children);
                    submenu = this.renderDropdownButton(term.children);
                }
                return (<li key={term.id}>
                    {term.name}
                    {submenu}
                </li>);
            })}
        </ul>)
    }
    handleClickEditingCard = (e, card, column, col_index, card_index) => {
        console.log("dans handleClickEditingCard : ", card, column, col_index, card_index);
        const state = {...this.state};
        state.editingACard = true;
        this.editedCard = card;
        this.editedColumn = column;
        this.editedCardIndexes = [col_index, card_index];
        this.setState(state);
    };
    handleClickAddingACard = numCol => {
        console.log("dans handleClickAddingACard");
        console.log("dans handleClickAddingACard. render_modal_add_edit_card : ", this.render_modal_add_edit_card);
        console.log("Numéro de column dans laquelle ajouter la card : " + numCol);
        this.numCol = numCol;
        const state = {...this.state};
        this.render_modal_add_edit_card = true;
        state.addingACard = true;
        this.setState(state);
    };
    changeStateAddingATerm = () => {
        console.log("dans' changeStateAddingATerm");
        const state = {...this.state};
        state.addingATerm = true;
        this.setState(state);
    };
    renderColumn = () => {
        if (this.state.columns.length) {
            return (<section className="row section-cards">
                {this.state.columns.map((col, index) => {
                    return (<Column
                        key={col.id}
                        id={col.id}
                        column={col}
                        label={col.name}
                        cards={col.cards}
                        onClickAddCard={this.handleClickAddingACard}
                        onClickEditCard={this.handleClickEditingCard}
                        onMoveCard={this.moveCard}
                        onShowAnswer={this.changeStateAnswer}
                        user={Coopernet.user}
                        col_index={index}
                        admin_mode={this.props.admin_mode}
                    />);
                })}
            </section>);
        }
    };

    /**
     * Fonction récursive qui modifie la propriété selected des termes enfants et parents
     * @param term
     * @param searchedThemeId
     * @return {boolean}
     */
    setSelectedInNestedTerms(term, searchedThemeId) {
        if (term.id === searchedThemeId) {
            term.selected = true;
            term.open = true;
            return true;
        }

        const children = Object.hasOwn(term, 'children') ? term.children : [];

        for (const child of children) {

            const isMatch = this.setSelectedInNestedTerms(child, searchedThemeId);

            // isMatch est true dans le cas d'un parent si l'enfant a renvoyé true
            if (isMatch) {
                term.selected = true;
                term.open = false;
                return true;
            }
        }
        term.selected = false;
        term.open = false;
        return false;
    };

    /**
     * Boucle sur le tableau des termes du state et appelle la fonction récursive setSelectedInNestedTerms
     * @param searchedThemeId
     * @return {boolean}
     */
    handleClickHomeTermTable = (searchedThemeId) => {
        const state = {...this.state};

        for (const term of state.terms) {
            const isMatch = this.setSelectedInNestedTerms(term, searchedThemeId)
            if (isMatch) {
                return true;
            }
        }

    };
    handleClickHomeTableRow = async termAndCols => {
        const state = {...this.state};
        state.columns = await Coopernet.getCards(termAndCols.card_theme_id);
        state.term_name = termAndCols.name;
        this.themeId = termAndCols.card_theme_id;
        this.handleClickHomeTermTable(termAndCols.card_theme_id);
        this.setState(state);
    };

    changeStateAnswer = (e, card, column) => {
        /* console.log("dans changeStateAnswer");
        console.log("Theme : " + this.themeId);
        console.log("card : " + card);
        console.log("column : " + column.id); */
        // il faut maintenant changer le state de la card en question en
        // retrouvant l'index de la column en fct de l'id de la column
        // puis l'index de la card en fct de l'id de la card
        let state = {...this.state};
        let column_index = state.columns.indexOf(column);
        //console.log("Index de la column : " + column_index);
        let card_index = state.columns[column_index].cards.indexOf(card);
        //console.log("Index de la card : " + card_index);
        state.columns[column_index].cards[card_index].show_answer = !state.columns[column_index].cards[card_index].show_answer;

        this.setState(state);
    };

    render() {
        console.log('Dans render de Table.js', Coopernet);

        if (!this.props.userIsLogged) {
            return <Navigate to="/"/>;
        }

        return (<div>
            {!this.state.userIsLogged && (<Navigate to="/"/>)}
            <div className="container">
                {this.state.msgError && (<div className="alert alert-warning">{this.state.msgError}</div>)}
                {this.renderFormAddOrEditCard()}
                {this.renderTerms()}
                {this.renderFormAddOrEditTerm()}
                {!this.state.term_name && <HomeTableTerms handleClickHomeTableRow={this.handleClickHomeTableRow}/>}
                {this.state.term_name && (<h2 className="title-term-name">{this.state.term_name}</h2>)}
                {this.renderColumn()}
            </div>
        </div>);
    }
}

export default Table;
