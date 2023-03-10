class Coopernet {

    static url_server = (process.env.NODE_ENV === 'development') ? 'http://local.coopernet.my/' : 'https://coopernet.fr/';
    static user = {
        id: 0, name: "", pwd: ""
    };
    static oauth = {};
    static payload

    static getTermsAndColumns = async (user_id = null) => {
        await Coopernet.setOAuthToken();
        console.log('getTermsAndColumns');
        const response = await fetch(this.url_server + 'rest/cards' + (user_id ? '/' + user_id : '') + '?_format=json', {
            method: "GET", headers: {
                "Authorization": this.oauth.token_type + " " + this.oauth.access_token,
            }
        })
        if (response.ok) {
            return response.json();
        } else {
            throw new Error(`Erreur HTTP lors de la récupération des termes et colonnes. Statut: ${response.status}`);
        }
    }

    static toArrayTermsAndCol = async (user_id = null) => {
        const sortedTerms = [];
        const datas = user_id ? await Coopernet.getTermsAndColumns(user_id) : await Coopernet.getTermsAndColumns();

        for (let i = 0; i < datas.length - 1; i++) {
            const {name, field_card_theme, field_card_column} = datas[i];
            if (i === 0 || parseInt(field_card_theme) !== parseInt(datas[i - 1].field_card_theme)) {
                sortedTerms.push({name: name, card_theme_id: field_card_theme, cols: {17: 0, 18: 0, 19: 0, 20: 0}}); // 17, 18, 19, 20 sont les id des colonnes
            }
            const index = sortedTerms.findIndex((term) => parseInt(term.card_theme_id) === parseInt(field_card_theme));
            sortedTerms[index].cols[field_card_column]++;
        }
        return sortedTerms.filter(term => term.cols["17"] !== 0 || term.cols["18"] !== 0 || term.cols["19"] !== 0 || term.cols["20"] !== 0);
    };

    static getClientID = async () => {
        console.log('getClientID');
        const response = await fetch(Coopernet.url_server + 'oauth/memo/clientId')
        if (response.ok) {
            return await response.json();
        }
    }

    /**
     * Prépare le payload pour la demande d'authentification
     * @param {boolean} refresh
     * True : Prépare pour une demande avec le token de rafraîchissement
     * False : Prépare pour une demande avec username et password
     */
    static setPayload = async refresh => {
        const payload = new FormData();


        payload.append("client_id", await Coopernet.getClientID());
        payload.append("client_secret", "pkyuRTHr8hy:;O6tTo");

        if (refresh) {
            payload.append("grant_type", "refresh_token");
            payload.append("refresh_token", Coopernet.oauth.refresh_token);

        } else {
            payload.append("grant_type", "password");
            payload.append("username", Coopernet.user.name);
            payload.append("password", Coopernet.user.pwd);
        }
        this.payload = payload;
    };

    /**
     * Set le token Oauth
     * @return {Promise<boolean>} - return false si le status est pas ok SINON return true
     */
    static setOAuthToken = async () => {

        if (this.oauth.hasOwnProperty('access_token')) {
            if (Coopernet.isExpiredOauth()) {
                console.log('Demande avec refresh_token');
                return Coopernet.setRefreshToken();
            } else {
                console.log('Pas de demande');
                return true;
            }
        } else {
            console.log('Demande avec ID et Password')
            return Coopernet.fetchOauth(false);
        }
    };

    /**
     * check si le token a expiré
     * @return {boolean}
     */
    static isExpiredOauth = () => this.oauth.expireAt - Date.now() < 0;

    /**
     * fetch post pour avoir le Oauth token
     * @param {boolean} payload
     * True : Prépare pour une demande avec le token de rafraîchissement
     * False : Prépare pour une demande avec username et password
     * @return {Boolean} True si tout se passe bien
     * @throws {Error} Erreur de statut dans la récupération du token oauth
     */
    static fetchOauth = async (payload) => {
        console.log('fetchOauth');
        await this.setPayload(payload);
        const response = await fetch(this.url_server + "oauth/token", {
            method: "POST", body: this.payload,
        });

        console.debug(response);

        if (response.ok) {
            const token = await response.json();
            // token est un objet avec plusieurs propriétés dont refresh_token, access_token, expires_in, ...
            console.log("token : ", token);
            this.oauth = token;
            this.oauth.expireAt = Date.now() + token.expires_in * 1000;
            localStorage.setItem('token', JSON.stringify(this.oauth.refresh_token));
            return true;
        }
        throw new Error(`Erreur HTTP lors de la récupération du token OAuth. Statut: ${response.status}`);
    };

    /**
     * Set le Oauth token avec le refresh_token
     * @return {Promise<boolean|undefined>}
     */
    static setRefreshToken = async () => this.fetchOauth(true);

    /**
     * Sert à vérifier si l'utlisateur a déjà été connecté il y a moins de 14 jours à l'aide du localStorage et set les token
     * SI oui, retourne true
     * SINON, retourne false
     * @return {Promise<boolean>}
     */
    static getStorage = async () => {
        const refreshToken = JSON.parse(localStorage.getItem('token')); //Récupère le refresh token dans le local storage
        if (refreshToken) { //Vérifie si il y en a un, si il y en a pas, return false
            this.oauth.refresh_token = refreshToken; //Affecte la valeur du token récupéré
            if (await Coopernet.setRefreshToken()) { //Si la création d'un nouveau token sur coopernet à l'aide du refresh_token du local storage fonctionne :
                localStorage.setItem('token', JSON.stringify(this.oauth.refresh_token)); //Le refresh_token a été rafraîchi, donc je stock le nouveau
                return true;
            }
        }
        return false;
    }

    /**
     * Appel d'un endpoint de suppression de carte sur le serveur
     * @param {Number} card_id
     * @returns Promise
     */
    static removeCard = async (card_id) => {
        console.log(`dans removeCard - card_id ${card_id}`);
        await Coopernet.setOAuthToken();
        // utilisation de fetch
        return fetch(this.url_server + "api/card/" + card_id, {
            // permet d'accepter les cookies ?
            credentials: "same-origin", method: "DELETE", headers: {
                "Content-Type": "application/json",
                "Authorization": this.oauth.token_type + " " + this.oauth.access_token,
            }
        })
            .then(response => response)
            .then(data => {
                if (data.status === 204) {
                    console.log(`OK status 204 de removeCard`);
                    return data;
                } else {
                    throw new Error("Le status du serveur n'est pas 204", data.status);
                }
            });
    };

    /**
     * Appel d'un endpoint de suppression de Term sur le serveur
     *
     * @param {Number} tid
     * @returns Promise
     */
    static removeTerm = async (tid) => {
        console.log("dans removeTerm - term ", tid);
        await Coopernet.setOAuthToken();
        // utilisation de fetch
        return fetch(`${this.url_server}api/term/${tid}`, {
            // permet d'accepter les cookies ?
            credentials: "same-origin", method: "DELETE", headers: {
                "Content-Type": "application/json",
                "Authorization": this.oauth.token_type + " " + this.oauth.access_token,
            }
        })
            .then(response => response)
            .then(data => {
                console.log("data reçues dans removeTerm:", data);
                if (data.status === 204) {
                    return data;
                } else {
                    throw new Error("Le status du serveur n'est pas 204", data.status);
                }
            });
    };

    /**
     * Méthode qui permet à une card de changer de column
     */
    static createReqEditColumnCard = async (num_card, new_col_id, themeid, callbackSuccess, callbackFailed) => {
        console.log("Dans createReqEditColumnCard de coopernet");
        // création de la requête
        // utilisation de fetch

        await Coopernet.setOAuthToken();

        fetch(`${this.url_server}api/card/${num_card}/column`, {
            // permet d'accepter les cookies ?
            credentials: "same-origin", method: "PATCH", headers: {
                "Content-Type": "application/json",
                "Authorization": this.oauth.token_type + " " + this.oauth.access_token,
            }, body: JSON.stringify({
                field_card_column: new_col_id,
            })
        })
            .then(response => response.json())
            .then(data => {
                console.log("data reçues dans createReqEditColumnCard :", data);
                if (data) {
                    callbackSuccess(themeid);
                } else {
                    callbackFailed("Erreur de login ou de mot de passe");
                    throw new Error("Problème de data ", data);
                }
            })
            .catch(error => {
                console.error("Erreur attrapée dans createReqEditColumnCard", error);
            });
    };

    static createReqEditCard = async (card, themeid, columnid, callbackSuccess, callbackFailed, no_reload) => {
        console.debug("Dans createReqEditCard de coopernet", card);
        await Coopernet.setOAuthToken();

        let question_file = null;
        /*
         Si la propriété url existe et qu'elle a une valeur.
         L'opérateur ?. fonctionne de manière similaire à l'opérateur de chaînage .,
         à ceci près qu'au lieu de causer une erreur si une référence est null ou undefined,
         l'expression se court-circuite avec undefined pour valeur de retour.
         src : https://developer.mozilla.org/fr/docs/Web/JavaScript/Reference/Operators/Optional_chaining
        */
        if (card?.question_picture?.url) question_file = await Coopernet.postImage(card.question_picture, 'question');

        let explanation_file = null;
        if (card?.explanation_picture?.url) explanation_file = await Coopernet.postImage(card.explanation_picture, 'explanation');

        // création de la requête avec fetch
        const response = await fetch(this.url_server + "api/card/" + card.id, {
            // permet d'accepter les cookies ?
            credentials: "same-origin", method: "PATCH", headers: {
                "Content-Type": "application/json",
                "Authorization": this.oauth.token_type + " " + this.oauth.access_token,
            }, body: JSON.stringify({
                title: card.question,
                field_card_question: card.question,
                field_card_answer: card.answer,
                field_card_explanation: card.explanation,
                field_card_column: card.column,
                field_card_theme: themeid
            })
        })
        const data = await response.json();
        console.info("data reçues :", data);
        if (data) {
            if (question_file) {
                await Coopernet.addImageToCard(data.uuid[0].value, question_file.data.id, 'question');
            } else if (card.question_picture && Object.hasOwn(card.question_picture, 'delete') && card.question_picture.delete) {
                await Coopernet.deleteImageFromCard(data.uuid[0].value, 'question');
            }

            if (explanation_file) {
                await Coopernet.addImageToCard(data.uuid[0].value, explanation_file.data.id, 'explanation');
            } else if (card.explanation_picture && Object.hasOwn(card.explanation_picture, 'delete') && card.explanation_picture.delete) {
                await Coopernet.deleteImageFromCard(data.uuid[0].value, 'explanation');
            }
            callbackSuccess(themeid, no_reload);
        } else {
            callbackFailed("Erreur de login ou de mot de passe");
            throw new Error("Problème de donnée", data);
        }
    };

    /**
     * Fonction servant à trouver une photo via son id
     * @param id id de l'image à trouver.
     * @returns {Promise<any>}
     */
    static findImage = async (id) => {
        const response = await fetch(`${Coopernet.url_server}jsonapi/file/file?filter[drupal_internal__fid]=${id}`)
        return await response.json();
    }

    static createReqAddCards = async (card, themeid, callbackSuccess, callbackFailed) => {
        console.debug("Dans createReqAddCards de coopernet", card);
        await Coopernet.setOAuthToken();

        let question_file = null;
        // S'il y a un id au champ card.question_picture, c'est qu'on copie une carte sinon s'il y a juste une url, on ajoute une photo
        if (card?.question_picture?.id) question_file = await Coopernet.findImage(card.question_picture.id);
        else if (card?.question_picture?.url) question_file = await Coopernet.postImage(card.question_picture, 'question');

        let explanation_file = null;
        if (card.explanation_picture?.id) explanation_file = await Coopernet.findImage(card.explanation_picture.id);
        else if (card?.explanation_picture?.url) explanation_file = await Coopernet.postImage(card.explanation_picture, 'explanation');
        // création de la requête
        // utilisation de fetch
        const response = await fetch(this.url_server + "api/add/card", {
            method: "POST", headers: {
                "Content-Type": "application/json",
                "Authorization": this.oauth.token_type + " " + this.oauth.access_token,
            },
            body: JSON.stringify({
                title: card.question,
                field_card_question: card.question,
                field_card_answer: card.answer,
                field_card_explanation: card.explanation,
                field_card_column: card.column,
                field_card_theme: themeid,
            })
        })
        const data = await response.json();

        console.debug("!!!!!!!!!!!!!!!!!!!data reçues dans createReqAddCards: ", data);
        if (data.hasOwnProperty("created") && data.created[0].value) {
            if (question_file) {
                // Les fonctions findImage et postImage renvoient 2 formats de données différents
                const imageId = question_file.data?.id ? question_file.data.id : question_file.data[0].id;
                await Coopernet.addImageToCard(data.uuid[0].value, imageId, 'question');
            }
            if (explanation_file) {
                const imageId = explanation_file.data?.id ? explanation_file.data.id : explanation_file.data[0].id;
                await Coopernet.addImageToCard(data.uuid[0].value, imageId, 'explanation');
            }
            callbackSuccess(themeid, card.id);
        } else {
            callbackFailed("Erreur de login ou de mot de passe");
            throw new Error("Problème de donnée : ", data);
        }
    };

    static addImageToCard = async (card_uuid, image_uuid, inputType) => {
        console.debug('Dans addImageToCard', image_uuid)
        await Coopernet.setOAuthToken();

        const response = fetch(Coopernet.url_server + 'jsonapi/node/carte/' + card_uuid + '/relationships/field_card_' + inputType + '_picture', {
            method: 'PATCH', headers: {
                'Content-Type': 'application/vnd.api+json',
                'Accept': 'application/vnd.api+json',
                "Authorization": this.oauth.token_type + " " + this.oauth.access_token,
            }, body: JSON.stringify({
                "data": {
                    "type": "file--file",
                    "id": image_uuid
                }
            })
        })
        console.log((await response).status);
    }
    static deleteImageFromCard = async (card_uuid, inputType) => {
        console.debug('Dans addImageToCard')
        await Coopernet.setOAuthToken();

        const response = fetch(Coopernet.url_server + 'jsonapi/node/carte/' + card_uuid + '/relationships/field_card_' + inputType + '_picture', {
            method: 'PATCH', headers: {
                'Content-Type': 'application/vnd.api+json',
                'Accept': 'application/vnd.api+json',
                "Authorization": this.oauth.token_type + " " + this.oauth.access_token,
            }, body: JSON.stringify({
                "data": null
            })
        })
        console.log((await response).status);
    }

    static postImage = async (image, inputField) => {
        console.debug('Dans postImage')
        await Coopernet.setOAuthToken();

        const infoImage = Coopernet.getFile(image.url);
        const response = await fetch(Coopernet.url_server + 'jsonapi/node/carte/field_card_' + inputField + '_picture',
            {
                method: "POST", headers: {
                    "Content-Type": 'application/octet-stream',
                    "Accept": "application/vnd.api+json",
                    "Content-Disposition": `file; filename="${Math.random().toString(36).replace(/[^a-z]+/g, '')}.${infoImage[1]}"`,
                    "Authorization": this.oauth.token_type + " " + this.oauth.access_token,
                }, body: image.data.files[0]
            })
        if (response.ok) {
            return response.json();
        } else {
            console.debug('Fichier non envoyé', response.status);
        }
    }
    static getFile = (imageUrl) => {
        console.debug('imageURL', imageUrl)
        const path = imageUrl.split('\\');
        const finalPath = path[path.length - 1];
        return finalPath.split('.');
    }

    static createReqAddOrEditTerm = async (label, tid, callbackSuccess, callbackFailed, ptid = 0) => {
        console.log("Dans createReqAddOrEditTerm de coopernet, envoie du label : ", label);
        await Coopernet.setOAuthToken();

        //console.log("ptid : ", ptid);
        // création de la requête
        // utilisation de fetch
        fetch(this.url_server + "memo/term?_format=json", {
            // permet d'accepter les cookies ?
            credentials: "same-origin", method: "POST", headers: {
                "Content-Type": "application/json",
                "Authorization": this.oauth.token_type + " " + this.oauth.access_token,
            }, body: JSON.stringify({
                label: [{
                    value: label
                }], tid: [{
                    value: tid
                }], ptid: [{
                    value: ptid
                }]
            })
        })
            .then(response => response.json())
            .then(data => {
                console.log("data reçues : ", data);
                if (data.hasOwnProperty("newtid")) {
                    callbackSuccess(data.newtid, "added");
                } else if (data.hasOwnProperty("updatedtid")) {
                    callbackSuccess(data.updatedtid, "updated");
                } else {
                    callbackFailed("Erreur de login ou de mot de passe");
                    throw new Error("Problème de donnée", data);
                }
            })
            .catch(error => {
                console.error("Erreur attrapée dans createReqAddOrEditTerm", error);
            });
    };


    /*
     * Récupère les données structurées sous forme de json imbriqué
     * @param {Number} term_id
     * @returns Promise
     */
    static getCards = async (term_id, user_id = this.user.id) => {
        console.info('getCards')
        await Coopernet.setOAuthToken();

        return fetch(this.url_server + "memo/list_cards_term/" + user_id + "/" + term_id, {
            method: "GET", headers: {
                "Content-type": "application/json; charset=UTF-8",
                "Authorization": this.oauth.token_type + " " + this.oauth.access_token,
            }
        })
            .then((response) => {
                if (response.status === 200) return response.json(); else throw new Error("Problème de réponse du serveur :  " + response.status);
            })
            .then((data) => {
                console.debug("Data dans getCards : ", data);
                return data;
            });

    };

    static
    getUsers = async (callbackSuccess, callbackFailed) => {
        // création de la requête
        console.log("Dans getUsers de coopernet.");
        await Coopernet.setOAuthToken();

        const response = await fetch(this.url_server + "memo/users/", {
            method: "GET", headers: {
                "Content-type": "application/json; charset=UTF-8",
                "Authorization": this.oauth.token_type + " " + this.oauth.access_token,
            }
        })

        console.log("data reçues dans getUsers avant json() :", response);
        if (response.ok) {
            console.log("data reçues dans getUsers avant json() :", response);
            const data = await response.json();

            console.log("data reçues dans getTerms :", data);
            if (data) {
                // ajout de la propriété "open" à "false" pour tous les termes de
                // niveau 1
                //data.forEach()
                return data;
            } else throw new Error("Problème de data ", data);

        } else throw new Error("Problème de réponse ", response);

    };

    /**
     * Récupère les termes d'un utilisateur
     * @param {Object} user
     */
    static
    getTerms = async (user = this.user) => {
        // création de la requête
        console.log("Dans getTerms de coopernet. User = ", user);
        await Coopernet.setOAuthToken();

        return fetch(this.url_server + "memo/themes/" + user.id, {
            method: "GET", headers: {
                "Content-type": "application/json; charset=UTF-8",
                "Authorization": this.oauth.token_type + " " + this.oauth.access_token,
            }
        })
            .then(response => {
                console.log("data reçues dans getTerms avant json() :", response);
                if (response.status === 200) return response.json(); else throw new Error("Problème de réponse ", response);
            })
            .then(data => {
                console.log("data reçues dans getTerms :", data);
                if (data) {
                    return data;
                } else {
                    throw new Error("Problème de data ", data);
                }
            });
    };

    static
    isLoggedIn = async () => {
        console.debug("Dans isLoggedIn de Coopernet");
        await Coopernet.setOAuthToken();

        const response = await fetch(`${this.url_server}/memo/is_logged`, {
            method: "GET", headers: {
                "Content-type": "application/json; charset=UTF-8",
                "Authorization": this.oauth.token_type + " " + this.oauth.access_token,
            }
        })

        if (!response.ok) {
            throw new Error("Le serveur n'a pas répondu correctement");
        } else {
            const user = await response.json();
            Coopernet.user.id = user["user id"];
            return user["user id"];
        }
    };
}

export default Coopernet;