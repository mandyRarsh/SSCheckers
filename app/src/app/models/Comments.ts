export class Comments {

    static starters = [
        "Nice start!",
        "Not bad but OK!",
        "You sure about that first one?",
        "Yikes! Don't shit the bed too early!",
        "Yea, that should work out",
        "Not the worst start!",
        "That'll do, pig. That'll do",
        "Sure, that should work!",
        "Wouldn't have been my first choice, but OK!",
        "Get it!"
    ];

    static interims = [
        "Go get 'em, fruitcake!",
        "Keep swimming, bitch!",
        "Y0ou got dis...or whatever",
        "Not a bad move. Check your privilege",
        "You sure 'bout dat, playa?",
        "SICK!",
        "That'll do, pig. That'll do",
        "Sure, that should work!",
        "Wouldn't have been my first choice, but OK!",
        "Get it!"
    ];

    static jumps = [
        "Haha! You got torched, fool!",
        "Eat a dick, playboy. I gots more where that came from",
        "OOOH GOT EEEEM!",
        "Yea, fuck yo couch. Gimme dat checker",
        "MMMmm checkers taste gooood",
        "How could you let me take that so easily, dumbass?",
        "How my dick taste?",
        "WOW! This is easier than I thought!",
        "You know you're supposed to protect the checkers, right?",
        "Embarassing jump, brah"
    ];

    static getStart() {
        let rand = Math.floor(Math.random() * 10);
        return this.starters[rand];
    }

    static getInterim() {
        let rand = Math.floor(Math.random() * 10);
        return this.interims[rand];
    }

    static getJumps() {
        let rand = Math.floor(Math.random() * 10);
        return this.jumps[rand];
    }
}