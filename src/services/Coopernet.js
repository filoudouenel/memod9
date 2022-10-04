class Coopernet {

    static url_server = (process.env.NODE_ENV === 'development') ? 'http://local.coopernet.my/' : 'https://coopernet.fr/';
    static user = {
        id: 0, name: "", pwd: ""
    };
    static csrf = '';
    static oauth = {};
    static payload

    static getClientID = async () => {
        const response = await fetch(Coopernet.url_server + 'oauth/memo/clientId')
        if (response.ok){
            const clientId =  await response.json();
            console.info(clientId);
            return clientId;
        }
    }

    /**
     * @return {Promise<string>} le csrf token
     */
    static getCsrfToken = async () => {
        console.log(`Dans getCsrfToken`);
        const response = await fetch(this.url_server + "session/token");
        if (response.ok) {
            const token = await response.text();
            this.csrf = token;
            return token;
        } else {
            throw new Error(`Erreur HTTP lors de la récupération du token CSRF. Statut: ${response.status}`);
        }
    };

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
                await Coopernet.getCsrfToken();
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
    static removeCard = (card_id) => {
        console.log(`dans removeCard - card_id ${card_id}`);
        // utilisation de fetch
        return fetch(this.url_server + "node/" + card_id + "?_format=hal_json", {
            // permet d'accepter les cookies ?
            credentials: "same-origin",
            method: "DELETE",
            headers: {
                "Content-Type": "application/hal+json",
                "Authorization": this.oauth.token_type + " " + this.oauth.access_token,
                "X-CSRF-Token": this.csrf,
            },
            body: JSON.stringify({
                _links: {
                    type: {
                        href: this.url_server + "rest/type/node/carte"
                    }
                },

                type: [
                    {
                        target_id: "card"
                    }
                ]
            })
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
    static removeTerm = (tid) => {
        console.log("dans removeTerm - term ", tid);
        // utilisation de fetch
        return fetch(this.url_server + "taxonomy/term/" + tid + "?_format=hal_json", {
            // permet d'accepter les cookies ?
            credentials: "same-origin",
            method: "DELETE",
            headers: {
                "Content-Type": "application/hal+json",
                "Authorization": this.oauth.token_type + " " + this.oauth.access_token,
                "X-CSRF-Token": this.csrf,
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
    static createReqEditColumnCard = (
        num_card,
        new_col_id,
        themeid,
        callbackSuccess,
        callbackFailed
    ) => {
        console.log("Dans createReqEditColumnCard de coopernet");
        console.log("token : ", this.token);
        // création de la requête
        // utilisation de fetch

        fetch(this.url_server + "node/" + num_card + "?_format=hal_json", {
            // permet d'accepter les cookies ?
            credentials: "same-origin",
            method: "PATCH",
            headers: {
                "Content-Type": "application/hal+json",
                "Authorization": this.oauth.token_type + " " + this.oauth.access_token,
                "X-CSRF-Token": this.csrf,
            },
            body: JSON.stringify({
                _links: {
                    type: {
                        href: this.url_server + "rest/type/node/carte"
                    }
                },
                field_card_column: [
                    {
                        target_id: new_col_id,
                        url: "/taxonomy/term/" + new_col_id
                    }
                ],

                type: [
                    {
                        target_id: "card"
                    }
                ]
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

    static createReqEditCard = (
        card,
        themeid,
        columnid,
        callbackSuccess,
        callbackFailed,
        no_reload
    ) => {
        console.log("Dans createReqEditCard de coopernet");
        // création de la requête avec fetch
        fetch(this.url_server + "node/" + card.id + "?_format=hal_json", {
            // permet d'accepter les cookies ?
            credentials: "same-origin",
            method: "PATCH",
            headers: {
                "Content-Type": "application/hal+json",
                "Authorization": this.oauth.token_type + " " + this.oauth.access_token,
                "X-CSRF-Token": this.csrf,
            },
            body: JSON.stringify({
                _links: {
                    type: {
                        href: this.url_server + "rest/type/node/carte"
                    }
                },
                title: [
                    {
                        value: card.question
                    }
                ],
                field_card_question: [
                    {
                        value: card.question
                    }
                ],
                field_card_answer: [
                    {
                        value: card.answer
                    }
                ],
                field_card_explanation: [
                    {
                        value: card.explanation
                    }
                ],
                field_card_column: [
                    {
                        target_id: columnid,
                        url: "/taxonomy/term/" + columnid
                    }
                ],
                field_card_theme: [
                    {
                        target_id: themeid,
                        url: "/taxonomy/term/" + themeid
                    }
                ],
                type: [
                    {
                        target_id: "card"
                    }
                ]
            })
        })
            .then(response => response.json())
            .then(data => {
                console.log("data reçues :", data);
                if (data) {
                    callbackSuccess(themeid, no_reload);
                } else {
                    callbackFailed("Erreur de login ou de mot de passe");
                    throw new Error("Problème de donnée", data);
                }
            })
            .catch(error => {
                console.error("Erreur attrapée dans createReqEditCard :", error);
            });
    };

    static createReqAddCards = (
        card,
        themeid,
        callbackSuccess,
        callbackFailed
    ) => {
        console.log("Dans createReqAddCards de coopernet");
        // création de la requête
        // utilisation de fetch
        fetch(this.url_server + "node?_format=hal_json", {
            method: "POST",
            headers: {
                "Content-Type": "application/hal+json",
                "Authorization": this.oauth.token_type + " " + this.oauth.access_token,
                "X-CSRF-Token": this.csrf,
            },
            body: JSON.stringify({
                _links: {
                    type: {
                        href: this.url_server + "rest/type/node/carte"
                    }
                },
                title: [
                    {
                        value: card.question
                    }
                ],
                field_card_question: [
                    {
                        value: card.question
                    }
                ],
                field_card_answer: [
                    {
                        value: card.answer
                    }
                ],
                field_card_explanation: [
                    {
                        value: card.explanation
                    }
                ],
                field_card_column: [
                    {
                        target_id: card.column,
                        url: "/taxonomy/term/" + card.colonnne
                    }
                ],
                field_card_theme: [
                    {
                        target_id: themeid,
                        url: "/taxonomy/term/" + themeid
                    }
                ],
                type: [
                    {
                        target_id: "carte"
                    }
                ]
            })
        })
            .then(response => {
                return response.json()
                    .then(data => {
                        console.debug("!!!!!!!!!!!!!!!!!!!data reçues dans createReqAddCards: ", data);
                        if (data.hasOwnProperty("created") && data.created[0].value) {
                            callbackSuccess(themeid, card.id);
                        } else {
                            callbackFailed("Erreur de login ou de mot de passe");
                            throw new Error("Problème de donnée : ", data);
                        }
                    })
            })
            .catch(error => {
                console.error("Erreur catchée dans createReqAddCard : ", error);
            });
    };

    static createReqAddOrEditTerm = (
        label,
        tid,
        callbackSuccess,
        callbackFailed,
        ptid = 0
    ) => {
        console.log("Dans createReqAddOrEditTerm de coopernet, envoie du label : ", label);
        //console.log("ptid : ", ptid);
        // création de la requête
        // utilisation de fetch
        fetch(this.url_server + "memo/term?_format=hal_json", {
            // permet d'accepter les cookies ?
            credentials: "same-origin",
            method: "POST",
            headers: {
                "Content-Type": "application/hal+json",
                "Authorization": this.oauth.token_type + " " + this.oauth.access_token,
                "X-CSRF-Token": this.csrf,
            },
            body: JSON.stringify({
                _links: {
                    type: {
                        href: this.url_server + "memo/term"
                    }
                },
                label: [
                    {
                        value: label
                    }
                ],
                tid: [
                    {
                        value: tid
                    }
                ],
                ptid: [
                    {
                        value: ptid
                    }
                ]
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
    static getCards = (term_id) => {
        return fetch(
            this.url_server +
            "memo/list_cards_term/" +
            this.user.id +
            "/" +
            term_id,
            {
                method: "GET", headers: {
                    "Content-type": "application/json; charset=UTF-8",
                    "Authorization": this.oauth.token_type + " " + this.oauth.access_token,
                }
            }
        )
            .then((response) => {
                if (response.status === 200) return response.json();
                else throw new Error("Problème de réponse du serveur :  " + response.status);
            })
            .then((data) => {
                console.log("Data dans getCards : ", data);
                return data;
            });

    };

    static getUsers = async (callbackSuccess, callbackFailed) => {
        // création de la requête
        console.log("Dans getUsers de coopernet.");

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
    static getTerms = (user = this.user) => {
        // création de la requête
        console.log("Dans getTerms de coopernet. User = ", user);
        return fetch(this.url_server + "memo/themes/" +
            user.id, {
            method: "GET", headers: {
                "Content-type": "application/json; charset=UTF-8",
                "Authorization": this.oauth.token_type + " " + this.oauth.access_token,
            }
        })
            .then(response => {
                console.log("data reçues dans getTerms avant json() :", response);
                if (response.status === 200) return response.json();
                else throw new Error("Problème de réponse ", response);
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

    createReqLogout = () => {
        console.log("Dans createReqLogout de coopernet");
        fetch(this.url_server + "user/logout?_format=hal_json", {
            // permet d'accepter les cookies ?
            credentials: "same-origin",
            method: "GET",
            headers: {
                "Content-Type": "application/hal+json",
                "X-CSRF-Token": this.token
            }
        })
            .then(response => response)
            .then(data => {
                console.log("data reçues :", data);
                if (data) {
                    //callbackSuccess(themeid);
                } else {
                    //callbackFailed("Erreur de login ou de mot de passe");
                }
            })
            .catch(error => {
                console.error("Erreur attrapée dans createReqLogout", error)
            });
    };

    static isLoggedIn = async () => {
        console.debug("Dans isLoggedIn de Coopernet");
        const response = await fetch(`${this.url_server}/memo/is_logged`, {
            method: "GET", headers: {
                "Content-type": "application/json; charset=UTF-8",
                "Authorization": this.oauth.token_type + " " + this.oauth.access_token,
            }
        })
        console.debug(response);
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
