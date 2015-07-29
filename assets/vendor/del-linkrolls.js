/*
     FILE ARCHIVED ON 8:24:05 Feb 21, 2012 AND RETRIEVED FROM THE
     INTERNET ARCHIVE ON 3:48:08 Oct 27, 2014.
     JAVASCRIPT APPENDED BY WAYBACK MACHINE, COPYRIGHT INTERNET ARCHIVE.

     ALL OTHER CONTENT MAY ALSO BE PROTECTED BY COPYRIGHT (17 U.S.C.
     SECTION 108(a)(3)).
*/
/**
 * Delicious.Linkrolls
 * Renders the HTML for linkroll widgets.
 *
 * @package    delicious
 * @subpackage feeds
 * @author     lorchard
 */
Delicious.Linkrolls = function() {
    return {

        //! Default options used for render()
        defaults: {
            'BASE_URL':   '/web/20120221082405/http://www.delicious.com',
            'STATIC_URL': '/web/20120221082405/http://www.delicious.com/static',
            'title':      'My Delicious Bookmarks', 
            'count':      15,
            'sort':       'date',
            'tags':       false,
            'extended':   false,
            'logo_shown': false,
						'bullet':     false,

            EOF:null
        },

        /**
         *
         */
        writeln: function(o, posts) {
            document.write(this.render(o, posts));
        },

        /**
         * Given an array of options and a set of posts, build the HTML for the
         * linkroll.  The available options are:
         *
         *     sort: 'date', 'alpha'
         *     style: 'none'
         *     user: 'username'
         *     usertags: false, 'foo+bar'
         *     title: false, 'my delicious bookmarks'
         *     bullet: '&raquo;'
         *     icon: false, 'm', 's', 'rss'
         *     name: true, false
         *     showadd: true, false
         *     write: function()
         */
        render: function(o, posts) {

            var out = [];
            w = function (s) { out.push(s); }

            if (o.icon === true) o.icon = 'm';

            // Apply default options to incoming options.
            for (k in this.defaults)
                if (typeof o[k] == 'undefined')
                    o[k] = this.defaults[k];
                
            // Do some HTML escaping to avoid formatting probs and XSS
            o.title_h    = this.htmlEscape(o.title);
            o.user_h     = this.htmlEscape(o.user);
            o.user_q     = encodeURIComponent(o.user);
            o.usertags_q = encodeURIComponent(o.usertags);

            // Sort the posts alphabetically if necessary.
            if (o.sort == 'alpha') {
                posts.sort(function(a,b) {
                    var ad = (''+a.d).toLowerCase();
                    var bd = (''+b.d).toLowerCase();
                    return ( (ad > bd) ? 1 : ( (ad < bd) ? -1 : 0) );
                });
            } else {
                posts.sort(function(b,a) {
                    return ( (a.dt > b.dt) ? 1 : (a.dt < b.dt) ? -1 : 0 );
                });
            }

            // Include the blob of CSS if not disabled.
            if (o.style != 'none') {
                w('<style type="text/css"> .delicious-posts ul {list-style-type:none; margin: 0 0 1em 0; padding: 0 } .delicious-tag,.delicious-extended {font-size:smaller} .delicious-extended{margin:0;padding:0 0 0.25em 0} .module-list-item .delicious-posts ul{margin:0;padding:0} .module-list-item .delicious-posts h2, .module-list-item .delicious-posts li:first-child{margin-top:0} </style>');
            }

            w('<div class="delicious-posts" id="delicious-posts-'+o.user+'">');

            // If the plain logo will be used somewhere in the main body of the
            // linkroll, generate it.
            if (o.icon && (o.title || !(o.name || o.showadd))) {
                o.logo = this.getIcon(o, 'logo', o.icon, 'delicious',
                    (o.icon != 'rss') ? '' : 'rss/'+o.user+(o.usertags?'/'+o.usertags_q:'')
                );
            }

            // Build the title if necessary.  The icon appears before the
            // title, unless it's the RSS icon.
            if (o.title) {
                w('<h2 class="delicious-banner sidebar-title">');
                if (o.icon && o.icon != 'rss') { w(o.logo+' '); }
                w('<a href="'+o.BASE_URL+'/'+o.user_q+(o.usertags?'/'+o.usertags_q:'')+'">'+o.title_h+'</a>');
                if (o.icon == 'rss') { w(' '+o.logo); }
                w('</h2>');
            }

            w('<ul>');

            // Iterate through all the posts and build the linkroll main body.
            for(var i=0,p;( i<o.count ) && ( p=posts[i] );i++){
                w('<li class="delicious-post delicious-'+(i%2?'even':'odd')+'">');
                if (o.bullet) { w(o.bullet+'&#160;'); }
                w('<a class="delicious-link"'+(p.n?(' title="'+this.htmlEscape(p.n)+'"'):'')+' href="'+p.u+'">'+this.htmlEscape(p.d)+'</a> ');
                if (o.tags) {
                    if (p.t) {
                        for(var j=0;j<p.t.length;j++) {
                            if(p.t[j].length!=0) {
                                if(j==0) w(' / ');
                                w('<a class="delicious-tag" href="'+o.BASE_URL+'/'+o.user_q+'/'+encodeURIComponent(p.t[j])+'">'+this.htmlEscape(p.t[j])+'</a> ')
                            }
                        }
                    }
                }
                if(o.extended) {
                    if(p.n) w('<p class="delicious-extended">'+this.htmlEscape(p.n)+'</p>');
                }
                w('</li>');
            }

            // If the logo wasn't used in the title, and there are neither name
            // nor network add options to come, then insert the logo now so it
            // appears somewhere at least.
            if (o.icon && !(o.title || o.name || o.showadd)) {
                w('<li class="delicious-endlogo">'+o.logo+'</li>');
            }

            w('</ul>');

            // Include the link to the user's bookmarks, if needed.
            if (o.name) {
                w('<span class="delicious-network-username">' +
                    this.getIcon(o, 'name', o.icon, o.user_h, o.user_q)+
                    ' I am <a href="'+o.BASE_URL+'/'+o.user+'">'+o.user+'</a> '+
                    'on <a href="'+o.BASE_URL+'">Delicious</a></span><br/>');
            }

            // Include the 'add me to your network' link if needed.
            if (o.showadd) {
                w('<span class="delicious-network-add">'+
                    this.getIcon(o, 'add', o.icon, 'delicious', "network?add="+o.user_q)+' ');
                w('<a href="'+o.BASE_URL+'/settings/networkedit?action=add&username='+o.user_q+'">'+
                    'Add me to your '+((o.name)?'':'Delicious')+' network</a></span><br/>');
            }

            w('</div>');

            return out.join('');
        },

        //! Icons by type and size, used by getIcon()
        icons: {
            logo: {
                'm':   [ 'delicious.med.gif',   16, 16 ],
                's':   [ 'delicious.small.gif', 10, 10 ],
                'rss': [ 'del_feedIcon.gif', 14, 14 ]
            },
            name: {
                'm':   [ 'delicious.med.gif',   16, 16 ],
                's':   [ 'delicious.small.gif', 10, 10 ],
                'rss': [ 'delicious.small.gif', 10, 10 ]
            },
            add: {
                'm':   [ 'add.gif',       15, 15],
                's':   [ 'add.small.gif', 10, 10],
                'rss': [ 'add.small.gif', 10, 10]
            }
        },

        /**
         * Common method for generating linked icons based on the user-supplied
         * size crossed with the kind of icon needed.  Also ensures that the
         * del logo appears somewhere at least once, regardless of what icon
         * kind is preferred at any particular part of the markup.
         */
        getIcon: function(o, kind, size, alt, link) {
            if (!o.logo_shown) {
                o.logo_shown = true;
                kind = 'logo';
            }
            var ic = this.icons[kind][size];
            if (!ic) {
                return '';
            } else {
                var out = '<img src="'+o.STATIC_URL+'/img/'+ic[0]+'" '+
                    'width="'+ic[1]+'" height="'+ic[2]+'" '+
                    'alt="'+alt+'" border="0">';
                if (typeof link != 'undefined')
                    out = '<a href="'+o.BASE_URL+'/'+link+'">'+out+'</a>';
                return out;
            }
        },

        /**
         * Apply rough HTML escaping to a string.
         */
        htmlEscape: function(s) {
            return (''+s).replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
        },

        EOF: null
    };
}();
