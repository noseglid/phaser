/**
 * @author       Richard Davey <rich@photonstorm.com>
 * @copyright    2019 Photon Storm Ltd.
 * @license      {@link https://opensource.org/licenses/MIT|MIT License}
 */

var Bodies = require('../lib/factory/Bodies');
var Body = require('../lib/body/Body');
var GetFastValue = require('../../../utils/object/GetFastValue');
var PhysicsEditorParser = require('../PhysicsEditorParser');
var Vertices = require('../lib/geometry/Vertices');

/**
 * [description]
 *
 * @namespace Phaser.Physics.Matter.Components.SetBody
 * @since 3.0.0
 */
var SetBody = {

    //  Calling any of these methods resets previous properties you may have set on the body, including plugins, mass, etc

    /**
     * Set the body on a Game Object to a rectangle.
     *
     * @method Phaser.Physics.Matter.Components.SetBody#setRectangle
     * @since 3.0.0
     *
     * @param {number} width - Width of the rectangle.
     * @param {number} height - Height of the rectangle.
     * @param {object} options - [description]
     *
     * @return {Phaser.GameObjects.GameObject} This Game Object.
     */
    setRectangle: function (width, height, options)
    {
        return this.setBody({ type: 'rectangle', width: width, height: height }, options);
    },

    /**
     * [description]
     *
     * @method Phaser.Physics.Matter.Components.SetBody#setCircle
     * @since 3.0.0
     *
     * @param {number} radius - [description]
     * @param {object} options - [description]
     *
     * @return {Phaser.GameObjects.GameObject} This Game Object.
     */
    setCircle: function (radius, options)
    {
        return this.setBody({ type: 'circle', radius: radius }, options);
    },

    /**
     * Set the body on the Game Object to a polygon shape.
     *
     * @method Phaser.Physics.Matter.Components.SetBody#setPolygon
     * @since 3.0.0
     *
     * @param {number} radius - The radius of the polygon.
     * @param {number} sides - The amount of sides creating the polygon.
     * @param {object} options - A matterjs config object.
     *
     * @return {Phaser.GameObjects.GameObject} This Game Object.
     */
    setPolygon: function (radius, sides, options)
    {
        return this.setBody({ type: 'polygon', sides: sides, radius: radius }, options);
    },

    /**
     * Creates a new matterjs trapezoid body.
     *
     * @method Phaser.Physics.Matter.Components.SetBody#setTrapezoid
     * @since 3.0.0
     *
     * @param {number} width - The width of the trapezoid.
     * @param {number} height - The height of the trapezoid.
     * @param {number} slope - The angle of slope for the trapezoid.
     * @param {object} options - A matterjs config object for the body.
     *
     * @return {Phaser.GameObjects.GameObject} This Game Object.
     */
    setTrapezoid: function (width, height, slope, options)
    {
        return this.setBody({ type: 'trapezoid', width: width, height: height, slope: slope }, options);
    },

    /**
     * [description]
     *
     * @method Phaser.Physics.Matter.Components.SetBody#setExistingBody
     * @since 3.0.0
     *
     * @param {MatterJS.Body} body - [description]
     * @param {boolean} [addToWorld=true] - [description]
     *
     * @return {Phaser.GameObjects.GameObject} This Game Object.
     */
    setExistingBody: function (body, addToWorld)
    {
        if (addToWorld === undefined)
        {
            addToWorld = true;
        }

        if (this.body)
        {
            this.world.remove(this.body);
        }

        this.body = body;

        for (var i = 0; i < body.parts.length; i++)
        {
            body.parts[i].gameObject = this;
        }

        var _this = this;

        body.destroy = function destroy ()
        {
            _this.world.remove(_this.body);
            _this.body.gameObject = null;
        };

        if (addToWorld)
        {
            this.world.add(body);
        }

        if (this._originComponent)
        {
            this.setOrigin(this.originX + this.centerOffsetX, this.originY + this.centerOffsetY);
        }

        return this;
    },

    /**
     * [description]
     *
     * @method Phaser.Physics.Matter.Components.SetBody#setBody
     * @since 3.0.0
     *
     * @param {object} config - [description]
     * @param {object} options - [description]
     *
     * @return {Phaser.GameObjects.GameObject} This Game Object.
     */
    setBody: function (config, options)
    {
        if (!config)
        {
            return this;
        }

        var body;

        //  Allow them to do: shape: 'circle' instead of shape: { type: 'circle' }
        if (typeof config === 'string')
        {
            //  Using defaults
            config = { type: config };
        }

        var shapeType = GetFastValue(config, 'type', 'rectangle');
        var bodyX = GetFastValue(config, 'x', this._tempVec2.x);
        var bodyY = GetFastValue(config, 'y', this._tempVec2.y);
        var bodyWidth = GetFastValue(config, 'width', this.width);
        var bodyHeight = GetFastValue(config, 'height', this.height);

        switch (shapeType)
        {
            case 'rectangle':
                body = Bodies.rectangle(bodyX, bodyY, bodyWidth, bodyHeight, options);
                break;

            case 'circle':
                var radius = GetFastValue(config, 'radius', Math.max(bodyWidth, bodyHeight) / 2);
                var maxSides = GetFastValue(config, 'maxSides', 25);
                body = Bodies.circle(bodyX, bodyY, radius, options, maxSides);
                break;

            case 'trapezoid':
                var slope = GetFastValue(config, 'slope', 0.5);
                body = Bodies.trapezoid(bodyX, bodyY, bodyWidth, bodyHeight, slope, options);
                break;

            case 'polygon':
                var sides = GetFastValue(config, 'sides', 5);
                var pRadius = GetFastValue(config, 'radius', Math.max(bodyWidth, bodyHeight) / 2);
                body = Bodies.polygon(bodyX, bodyY, sides, pRadius, options);
                break;

            case 'fromVertices':
            case 'fromVerts':

                var verts = GetFastValue(config, 'verts', null);

                if (verts)
                {
                    //  Has the verts array come from Vertices.fromPath, or is it raw?
                    if (typeof verts === 'string')
                    {
                        verts = Vertices.fromPath(verts);
                    }

                    if (this.body && !this.body.hasOwnProperty('temp'))
                    {
                        Body.setVertices(this.body, verts);

                        body = this.body;
                    }
                    else
                    {
                        var flagInternal = GetFastValue(config, 'flagInternal', false);
                        var removeCollinear = GetFastValue(config, 'removeCollinear', 0.01);
                        var minimumArea = GetFastValue(config, 'minimumArea', 10);
    
                        body = Bodies.fromVertices(bodyX, bodyY, verts, options, flagInternal, removeCollinear, minimumArea);
                    }
                }

                break;

            case 'fromPhysicsEditor':
                body = PhysicsEditorParser.parseBody(bodyX, bodyY, bodyWidth, bodyHeight, config);
                break;
        }

        if (body)
        {
            this.setExistingBody(body, config.addToWorld);
        }

        return this;
    }

};

module.exports = SetBody;
