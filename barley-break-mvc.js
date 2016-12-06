/**
 * Created by igor on 19.11.16.
 */

/**
 * Model for game status storage.
 * @param sequence - list of saved parts.
 * @param parts - vertical and horizontal field size.
 * @param controller - object to control actions.
 * @constructor
 */
var BarleyBreakModel = function(sequence, parts, controller) {
    this.sequence = sequence;
    this.parts = parts;
    this.data = [];
    this.controller = controller;
};

BarleyBreakModel.prototype = {

    /** Generates a two-dimensional array from a list. */
    toData: function() {
        for (var i = 0; i < this.parts; i++) {
            this.data[i] = [];
            for (var j = 0; j < this.parts; j++) {
                this.data[i][j] = this.sequence[i * this.parts + j];
            }
        }
        return this.data;
    },

    /** Generates a list from two-dimensional array. */
    fromData: function() {
        for (var i = 0; i < this.parts; i++) {
            for (var j = 0; j < this.parts; j++) {
                this.sequence[i * this.parts + j] = this.data[i][j];
            }
        }
        return this.sequence;
    },

    /** Checks if the sequence of parts is correct. */
    checkWin: function() {
        var firstZero = this.data[0][0] == 0 ? 1 : 0;
        var isWin = true;
        for (var i = firstZero; i < this.parts * this.parts + firstZero - 1; i++) {
            if (this.data[Math.floor(i / this.parts)][i % this.parts] != i)
                isWin = false;
        }
        return isWin;
    },

    /** Fills the field with a random parts. */
    fillWithRandom: function() {
        var j, x, i;
        this.sequence = [];
        for (i = 0; i < this.parts * this.parts; ++i) {
            this.sequence.push(i);
        }
        for (i = this.sequence.length; i; i--) {
            j = Math.floor(Math.random() * i);
            x = this.sequence[i - 1];
            this.sequence[i - 1] = this.sequence[j];
            this.sequence[j] = x;
        }
        return this;
    },

    /**
     * Exchanges 2 DOM elements.
     * @param crop - the first element.
     * @param cropTo - the second element.
     */
    exchange: function(crop, cropTo) {
        var temp = this.data[crop.i][crop.j];
        this.data[crop.i][crop.j] = this.data[cropTo.i][cropTo.j];
        this.data[cropTo.i][cropTo.j] = temp;
    },

    /**
     * Finds the part index in data array.
     * @param ids - pair of keys {i: {Number}, j: {Number}} with element index.
     * @returns {Array|*} - value of current part.
     */
    get: function(ids) {
        if (ids.i === undefined || ids.j === undefined) return;
        return this.data && this.data[ids.i] && this.data[ids.i][ids.j];
    }
};

/**
 * View for game.
 * @param container - HTML element with game.
 * @param controller - object to control axtions.
 * @constructor
 */
var BarleyBreakView = function(container, controller) {
    this.container = container;
    this.controller = controller;
};

BarleyBreakView.prototype = {

    /**
     * Creates a game in container.
     * @param image - URL of image.
     * @param size - CSS width/height in px.
     * @param parts - count of parts.
     */
    create: function(image, size, parts) {
        this.container.classList.add('barley-break-container');
        this.image = image;
        this.parts = parts;

        this.wrap = document.createElement("div");
        this.wrap.classList.add("wrap");
        this.wrap.style.width = this.wrap.style.height = size + parts + 'px';
        this.container.appendChild(this.wrap);

        var cropSize = this.cropSize = size / parts, self = this;
        for (var i = 0; i < parts; i++) {
            for (var j = 0; j < parts; j++) {
                var crop = this.createCrop(i, j, this.controller.getDataId({i: i, j: j}));
                this.wrap.appendChild(crop);
            }
        }

        this.results = document.createElement('div');
        this.results.classList.add('results');
        this.results.innerHTML = '<img src="' + image + '"><div class="moves">0</div>';
        this.container.appendChild(this.results);
        this.movesWrap = this.results.getElementsByClassName('moves')[0];

        this.wrap.addEventListener('mousedown', function(event) {
            var target = event.target;
            var zeroCrop = document.getElementById('crop-0');
            var zeroColumn = zeroCrop.dataset.column, zeroRow = zeroCrop.dataset.row;
            var column = target.dataset.column, row = target.dataset.row;
            if ((column == zeroColumn) != (row == zeroRow) && Math.abs(zeroColumn - column) + Math.abs(zeroRow - row) == 1) {
                var zeroCropClone = self.createCrop(row, column, 0);
                var thisCropClone = self.createCrop(zeroRow, zeroColumn, self.controller.getDataId({i: row, j: column}));
                self.wrap.replaceChild(thisCropClone, zeroCrop);
                self.wrap.replaceChild(zeroCropClone, target);

                self.controller.exchange({i: zeroRow, j: zeroColumn}, {i: row, j: column});

                self.movesWrap.innerHTML = self.controller.getMoves();
                if (self.controller.checkWin()) {
                    alert('You are win!');
                }
            }
        }, false);

        window.addEventListener('unload', function() {
            self.controller.save();
        }, false);
    },

    /**
     * Creates a part of field.
     * @param i - row of field table.
     * @param j - column of field table.
     * @param index - value of part.
     * @returns {Element} - div contains a part of image.
     */
    createCrop: function(i, j, index) {
        var crop = document.createElement('div'), self = this;
        crop.id = "crop-" + index;
        crop.dataset.row = i;
        crop.dataset.column = j;
        crop.classList.add('crop');
        Object.assign(crop.style, {
            width: this.cropSize + 'px',
            height: this.cropSize + 'px',
            top: i * (this.cropSize + 1) + 'px',
            left: j * (this.cropSize + 1) + 'px',
            background: index ? 'url(' + this.image + ') no-repeat' : '',
            backgroundPosition: - (index % this.parts) * this.cropSize + 'px -' + Math.floor(index / this.parts) * this.cropSize + 'px'
        });
        return crop;
    }
};

/**
 * Controller and main class of game.
 * @param container - HTML element with game field.
 * @constructor
 */
var BarleyBreakController = function(container) {
    this.view = new BarleyBreakView(container, this);
    this.moves = 0;
};

BarleyBreakController.prototype = {

    /**
     * Creates a game and initializes game parameters.
     * @param image - URL of image.
     * @param size - CSS width/height in px.
     * @param parts - count of parts.
     */
    create: function(image, size, parts) {
        var data = localStorage.getItem("barley-break");
        if (window.localStorage && data !== null) {
            try {
                data = JSON.parse(data);
                if (data.length === parts * parts)
                    this.model = new BarleyBreakModel(data, parts, this);
            } catch (e) {
                console.log("Local Storage parsing error.");
            }
        }
        if (this.model === undefined) {
            this.model = new BarleyBreakModel([], parts, this);
            this.model.fillWithRandom();
        }
        this.model.toData();
        this.view.create(image, size, parts);
    },

    /** Returns a current move id */
    getMoves: function() {
        return ++this.moves;
    },

    /** Checks if the sequence of parts is correct. */
    checkWin: function() {
        return this.model.checkWin();
    },

    /**
     * Exchanges 2 DOM elements.
     * @param crop - the first element.
     * @param cropTo - the second element.
     */
    exchange: function(crop, cropTo) {
        return this.model.exchange(crop, cropTo);
    },

    /**
     * Finds the part index in data array.
     * @param ids - pair of keys {i: {Number}, j: {Number}} with element index.
     * @returns {Array|*} - value of current part.
     */
    getDataId: function(ids) {
        return this.model.get(ids);
    },

    save: function() {
        if (window.localStorage) {
            localStorage.setItem("barley-break", JSON.stringify(this.model.fromData()));
        }
    }
};

var BarleyBreak = BarleyBreakController;
