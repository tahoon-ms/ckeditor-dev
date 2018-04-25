/* bender-tags: editor */
/* bender-ckeditor-plugins: autocomplete, caretposition */

( function() {
	'use strict';

	bender.editors = {
		classic: {
			name: 'editor1'
		},
		inline: {
			name: 'editor2',
			creator: 'inline'
		}
	};

	bender.test( {

		setUp: function() {
			if ( CKEDITOR.env.ie && CKEDITOR.env.version == 8 ) {
				assert.ignore();
			}

			CKEDITOR.document.getBody().setStyles( {
				position: 'static',
				margin: '0'
			} );
		},

		'test create element': function() {
			var editor = this.editors.classic,
				view = new CKEDITOR.plugins.autocomplete.view( editor );

			assertViewElement( editor, view.createElement() );
		},

		'test append': function() {
			var editor = this.editors.classic,
				view = new CKEDITOR.plugins.autocomplete.view( editor );

			view.append();

			assert.areSame( CKEDITOR.document, view.document );
			assertViewElement( editor, view.element );
		},

		'test open': function() {
			var editor = this.editors.classic,
				view = new CKEDITOR.plugins.autocomplete.view( editor );

			view.append();
			view.open();

			assert.isTrue( view.element.hasClass( 'cke_autocomplete_opened' ) );
		},

		'test close': function() {
			var editor = this.editors.classic,
				view = new CKEDITOR.plugins.autocomplete.view( editor );

			view.append();
			view.open();
			view.close();

			assert.isFalse( view.element.hasClass( 'cke_autocomplete_opened' ) );
		},

		'test create item': function() {
			var editor = this.editors.classic,
				view = new CKEDITOR.plugins.autocomplete.view( editor ),
				item = { id: 1, name: 'item' };

			assertItemElement( item, view.createItem( item ) );
		},

		'test get caret rect (classic)': function() {
			var rect = getCaretRect( this.editors.classic, { top: 2, height: 3, left: 4 }, { y: 2, x: 4 } );

			assert.areEqual( 7, rect.bottom );
			assert.areEqual( 8, rect.left );
			assert.areEqual( 4, rect.top );
		},

		'test get caret rect (inline)': function() {
			var rect = getCaretRect( this.editors.inline, { top: 2, height: 3, left: 4 }, { y: 2, x: 4 } );

			assert.areEqual( 7, rect.bottom );
			assert.areEqual( 8, rect.left );
			assert.areEqual( 4, rect.top );
		},

		'test get caret rect with repositioned offset host (classic)': function() {
			CKEDITOR.document.getBody().setStyles( {
				position: 'relative',
				'margin-left': '10px',
				'margin-top': '10px'
			} );

			var rect = getCaretRect( this.editors.classic, { top: 10, height: 5, left: 10 }, { y: 2, x: 4 } );

			assert.areEqual( 7, rect.bottom );
			assert.areEqual( 4, rect.left );
			assert.areEqual( 2, rect.top );
		},

		'test get caret rect with repositioned offset host (inline)': function() {
			CKEDITOR.document.getBody().setStyles( {
				position: 'relative',
				'margin-left': '10px',
				'margin-top': '10px'
			} );

			var rect = getCaretRect( this.editors.inline, { top: 10, height: 5, left: 10 }, { y: 2, x: 4 } );

			assert.areEqual( 7, rect.bottom );
			assert.areEqual( 4, rect.left );
			assert.areEqual( 2, rect.top );
		},

		'test is item element': function() {
			var editor = this.editors.classic,
				view = new CKEDITOR.plugins.autocomplete.view( editor ),
				item = { id: 1, name: 'item' },
				itemElement = view.createItem( item );

			assert.isTrue( view.isItemElement( itemElement ) );
			assert.isFalse( view.isItemElement( CKEDITOR.document.createElement( 'li' ) ) );
		},

		'test update items': function() {
			var editor = this.editors.classic,
				view = new CKEDITOR.plugins.autocomplete.view( editor ),
				items = [ { id: 1, name: 'item1' }, { id: 2, name: 'item2' } ];

			view.append();
			view.updateItems( items );

			assertItemElement( items[ 0 ], view.getItemById( items[ 0 ].id ) );
			assertItemElement( items[ 1 ], view.getItemById( items[ 1 ].id ) );
		},

		'test select item': function() {
			var editor = this.editors.classic,
				view = new CKEDITOR.plugins.autocomplete.view( editor ),
				spy = sinon.spy( view, 'scrollElementTo' ),
				item1 = { id: 1, name: 'item1' },
				item2 = { id: 2, name: 'item2' },
				items = [ item1, item2 ];

			view.append();
			view.updateItems( items );
			view.selectedItemId = item1.id;

			view.selectItem( item2.id );

			assert.areEqual( item2.id, view.selectedItemId );
			assert.isTrue( view.getItemById( item2.id ).hasClass( 'cke_autocomplete_selected' ) );
			assert.isTrue( spy.calledOnce );
		},

		'test position not enough space between the caret and bottom viewport (classic)': function() {
			// +---------------------------------------------+
			// |                                             |
			// |       editor viewport                       |
			// |     +--------------+                        |
			// |     |              |                        |
			// |     |     view     |                        |
			// |     |              |                        |
			// |     +--------------+                        |
			// |     █ - caret position                      |
			// |                                             |
			// +---------------------------------------------+
			var view = createPositionedView( this.editors.classic, {
				caretRect: { top: 400, bottom: 410, left: 100 },
				editorViewportRect: { top: 0, bottom: 500 },
				viewPanelHeight: 100
			} );

			assert.areEqual( '300px', view.element.getStyle( 'top' ), 'View is displayed above the caret' );
			assert.areEqual( '100px', view.element.getStyle( 'left' ) );
		},

		'test position not enough space between the caret and bottom viewport - edge case (classic)': function() {
			// +---------------------------------------------+
			// |                                             |
			// |                                             |
			// |       editor viewport                       |
			// |     +--------------+                        |
			// |     |              |                        |
			// |     |     view     |                        |
			// |     |              |                        |
			// |     +--------------+                        |
			// +-----█---------------------------------------+
			//  			- caret position 1px above the viewport's bottom position
			var view = createPositionedView( this.editors.classic, {
				caretRect: { top: 199, bottom: 209, left: 100 },
				editorViewportRect: { top: 0, bottom: 200 },
				viewPanelHeight: 100
			} );

			assert.areEqual( '99px', view.element.getStyle( 'top' ), 'View is displayed above the caret' );
			assert.areEqual( '100px', view.element.getStyle( 'left' ) );
		},

		'test enough space under and above the caret (classic)': function() {
			// +---------------------------------------------+
			// |       editor viewport                       |
			// |                                             |
			// |                                             |
			// |                                             |
			// |     █ - caret position                      |
			// |     +--------------+                        |
			// |     |     view     |                        |
			// |     +--------------+                        |
			// |                                             |
			// |                                             |
			// +---------------------------------------------+
			var view = createPositionedView( this.editors.classic, {
				caretRect: { top: 100, bottom: 110, left: 50 },
				editorViewportRect: { top: 0, bottom: 500 },
				viewPanelHeight: 100
			} );

			assert.areEqual( '110px', view.element.getStyle( 'top' ), 'View is displayed below the caret' );
			assert.areEqual( '50px', view.element.getStyle( 'left' ) );
		},

		'test enough space under the caret - edge case (classic)': function() {
			//         - caret top position on a par with viewport's top
			// +-----█---------------------------------------+
			// |     +--------------+                        |
			// |     |     view     |                        |
			// |     +--------------+                        |
			// |                                             |
			// |                                             |
			// |      editor viewport                        |
			// +---------------------------------------------+
			var view = createPositionedView( this.editors.classic, {
				caretRect: { top: 0, bottom: 10, left: 50 },
				editorViewportRect: { top: 0, bottom: 200 },
				viewPanelHeight: 100
			} );

			assert.areEqual( '10px', view.element.getStyle( 'top' ), 'View is displayed below the caret' );
			assert.areEqual( '50px', view.element.getStyle( 'left' ) );
		},

		'test view position below viewport (classic)': function() {
			// +---------------------------------------------+
			// |       editor viewport                       |
			// |                                             |
			// |     +--------------+                        |
			// |     |              |                        |
			// |     |     view     |                        |
			// |     |              |                        |
			// +-----+==============+------------------------+
			// |																						 |
			// |     █ - caret position                      |
			// |                                             |
			// +---------------------------------------------+
			var view = createPositionedView( this.editors.classic, {
				caretRect: { top: 400, bottom: 410, left: 100 },
				editorViewportRect: { top: 0, bottom: 300 },
				viewPanelHeight: 100
			} );

			assert.areEqual( '200px', view.element.getStyle( 'top' ), 'View is displayed above the caret' );
			assert.areEqual( '100px', view.element.getStyle( 'left' ) );
		},

		'test view position above viewport (classic)': function() {
			// +---------------------------------------------+
			// |																						 |
			// |     █ - caret position                      |
			// |                                             |
			// +-----+==============+------------------------+
			// |     |              |                        |
			// |     |     view     |                        |
			// |     |              |                        |
			// |     +--------------+                        |
			// |																						 |
			// |       editor viewport                       |
			// +---------------------------------------------+
			var view = createPositionedView( this.editors.classic, {
				caretRect: { top: 100, bottom: 110, left: 50 },
				editorViewportRect: { top: 200, bottom: 500 },
				viewPanelHeight: 100
			} );

			assert.areEqual( '200px', view.element.getStyle( 'top' ), 'View is displayed below the caret' );
			assert.areEqual( '50px', view.element.getStyle( 'left' ) );
		},

		'test enough space under and above the caret (inline)': function() {
			// +---------------------------------------------+
			// |       editor viewport                       |
			// |                                             |
			// |                                             |
			// |                                             |
			// |     █ - caret position                      |
			// |     +--------------+                        |
			// |     |     view     |                        |
			// |     +--------------+                        |
			// |                                             |
			// |                                             |
			// +---------------------------------------------+
			var view = createPositionedView( this.editors.inline, {
				caretRect: { top: 100, bottom: 110, left: 50 },
				editorViewportRect: { top: 0, bottom: 500 },
				viewPanelHeight: 100
			} );

			assert.areEqual( '110px', view.element.getStyle( 'top' ), 'View is displayed below the caret' );
			assert.areEqual( '50px', view.element.getStyle( 'left' ) );
		},

		'test position not enough space between the caret and bottom viewport (inline)': function() {
			// +---------------------------------------------+
			// |                                             |
			// |       editor viewport                       |
			// |     +--------------+                        |
			// |     |              |                        |
			// |     |     view     |                        |
			// |     |              |                        |
			// |     +--------------+                        |
			// |     █ - caret position                      |
			// |                                             |
			// +---------------------------------------------+
			var view = createPositionedView( this.editors.inline, {
				caretRect: { top: 400, bottom: 410, left: 100 },
				editorViewportRect: { top: 0, bottom: 500 },
				viewPanelHeight: 100
			} );

			assert.areEqual( '300px', view.element.getStyle( 'top' ), 'View is displayed above the caret' );
			assert.areEqual( '100px', view.element.getStyle( 'left' ) );
		},

		'test position not enough space between the caret and bottom viewport - edge case (inline)': function() {
			// +---------------------------------------------+
			// |                                             |
			// |                                             |
			// |       editor viewport                       |
			// |     +--------------+                        |
			// |     |              |                        |
			// |     |     view     |                        |
			// |     |              |                        |
			// |     +--------------+                        |
			// +-----█---------------------------------------+
			//  			- caret position 1px above the viewport's bottom position
			var view = createPositionedView( this.editors.inline, {
				caretRect: { top: 199, bottom: 209, left: 100 },
				editorViewportRect: { top: 0, bottom: 200 },
				viewPanelHeight: 100
			} );

			assert.areEqual( '99px', view.element.getStyle( 'top' ), 'View is displayed above the caret' );
			assert.areEqual( '100px', view.element.getStyle( 'left' ) );
		},

		'test enough space under the caret - edge case (inline)': function() {
			//         - caret top position on a par with viewport's top
			// +-----█---------------------------------------+
			// |     +--------------+                        |
			// |     |     view     |                        |
			// |     +--------------+                        |
			// |                                             |
			// |                                             |
			// |      editor viewport                        |
			// +---------------------------------------------+
			var view = createPositionedView( this.editors.inline, {
				caretRect: { top: 0, bottom: 10, left: 50 },
				editorViewportRect: { top: 0, bottom: 200 },
				viewPanelHeight: 100
			} );

			assert.areEqual( '10px', view.element.getStyle( 'top' ), 'View is displayed below the caret' );
			assert.areEqual( '50px', view.element.getStyle( 'left' ) );
		},

		'test attach': function() {
			var editor = this.editors.classic,
				view = new CKEDITOR.plugins.autocomplete.view( editor ),
				spy = sinon.spy( view, 'fire' ),
				item1 = { id: 1, name: 'item1' },
				item2 = { id: 2, name: 'item2' },
				items = [ item1, item2 ];

			view.append();
			view.updateItems( items );

			view.attach();
			view.element.fire( 'click', new CKEDITOR.dom.event( { target: view.getItemById( item2.id ).$ } ) );

			assert.isTrue( spy.calledWith( 'click-item', item2.id.toString() ) );
		}

	} );

	function createPositionedView( editor, config ) {
		var view = new CKEDITOR.plugins.autocomplete.view( editor ),
			getClientRectStub = sinon.stub( CKEDITOR.dom.element.prototype, 'getClientRect' ).returns( config.editorViewportRect );

		view.append();

		sinon.stub( view.element, 'getSize' ).returns( config.viewPanelHeight );

		view.setPosition( config.caretRect );

		getClientRectStub.restore();

		return view;
	}

	function assertViewElement( editor, element ) {
		var zIndex = editor.config.baseFloatZIndex - 3,
			expectedHtml = '<ul class="cke_autocomplete_panel" style="z-index: ' + zIndex + ';"></ul>';

		assert.areEqual( expectedHtml, bender.tools.compatHtml( element.$.outerHTML, false, true ) );
	}

	function assertItemElement( item, itemElement ) {
		assert.areEqual( '<li data-id="' + item.id + '">' + item.name + '</li>', itemElement.$.outerHTML );
	}

	function getCaretRect( editor, caretPosition, offset ) {
		var view = new CKEDITOR.plugins.autocomplete.view( editor ),
			caretPositionStub = sinon.stub( CKEDITOR.dom.selection.prototype, 'getCaretPosition' ).returns( caretPosition ),
			offsetStub;

		if ( editor.editable().isInline() ) {
			offsetStub = sinon.stub( CKEDITOR.document, 'getWindow' ).returns( {
				getScrollPosition: function() {
					return offset;
				}
			} );
		} else {
			offsetStub = sinon.stub( CKEDITOR.editable.prototype, 'getParent' ).returns( {
				getDocumentPosition: function() {
					return offset;
				}
			} );
		}

		view.append();

		var caretRect = view.getCaretRect();

		caretPositionStub.restore();
		offsetStub.restore();

		return caretRect;
	}

} )();
