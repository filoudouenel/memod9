const About = () => {
    return (
        <div className="mt-5 about">
            <h3 className="mb-5">Memopus dans l'avenir</h3>
            <p>
                Cette application à but pédagogique a été créée avec React du côté front et Drupal du côté back.

                <br></br>Elle s’appuie sur la technique de mémorisation dite « <a target="_blank" href="https://ncase.me/remember/fr.html">Répétition espacée</a> ».

                </p>
                <p>
                Elle mériterait d’être améliorée, consolidée et étendue.<br></br>
                Pour ce faire, des ressources ont été trouvées et une nouvelle version devrait être diffusée en août 2023.
                </p>
                <p>L'objectif de cette application est d'aider un maximum d'apprenants de façon libre et gratuite. S'il n'est pas possible de faire autrement, des annonceurs apparaîtront peut être.</p>
                <p>Si vous avez des idées ou des ressources pour l’amélioration et le développement de cette application, contactez moi : y.douenel@coopernet.fr.
                </p>
                <p className="mt-5">
                Yvan Douënel, <span className="grey-light">fondateur de Coopernet</span>
            </p>
        </div>
    );
}

export default About;