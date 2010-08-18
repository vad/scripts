#!/usr/bin/env python2.4

"""
  TODO: inserire da qualche parte nell'id3 anche l'id del podcast
"""

import sqlite, re

global con

def feed(url, table, filter_field = '', filter_exp = ''):
    """
    filter_exp e` una regexp
    """
    import feedparser, urllib2

    #proxy = urllib2.ProxyHandler( {"http":"http://yourproxy:PORT"} )
    #d = feedparser.parse(url, handlers = [proxy])
    d = feedparser.parse(url)
    cur = getCon().cursor()

    for entry in d['entries']:
        try:
            if (not filter_field) or (re.match(filter_exp.lower(), entry[filter_field].lower())):

                # i replace servono a raddoppiare gli eventuali apici nelle stringhe
                # che darebbero casini con gli apici dell'SQL
                desc = (entry["title_detail"]["value"]).replace("'", "''")
                sInsert = "insert into %s (id, url, title, date, description) values ('%s', '%s', '%s', '%s', '%s');" % (table, entry.id, entry.link, entry.title.replace("'", "''"), entry.updated, desc)

                # esegui la query
                cur.execute(sInsert.encode('latin-1'))


                ## verde: aggiunto alla tabella del DB
                print "%s: \033[1;32maggiunto\033[1;0m" % entry.link

            else:
                ## rosso: non soddisfa i filtri
                print "%s: \033[1;31mfiltrato %s \033[1;0m" % (entry.link, entry[filter_field])

        except sqlite.Error, e:
            ## rosso: eccezione se PK (cioe` ID) gia` presente nella tabella
            print "%s: \033[1;31mvecchio\033[1;0m" % entry.link
            #print e.args[0]

    getCon().commit()



def retrieve(table, path = "/PATH/", sSostAuthor = ''):
    import os, pyid3lib

    cur = getCon().cursor()
    cur.execute("select id, url, author, title, description from %s where state = 0" % table)

    curUpdate = getCon().cursor()
    for (id, url, author, title, description) in cur:
        # qui i replace servono ad evitare che si tenti di scrivere un file con nome
        # non valido (con dentro delle /, cosi` le sostituisco con dei -). Utile con
        # certe date.
        filename = ("%s/%s.mp3" % (path, title.replace("/", "-"))).replace("\"", "\\\"")

        # replace dovrebbe prevenire eventuali virgolette (NON PROVATO)
        # NOTA: non si puo` usare ', perche' sh non prevede caratteri di escape per correggere l' eventuale presenza di ' nel filename
        h = os.popen("wget -c -o /dev/stdout -O \"%s\".tmp.mp3 %s" % (filename, url))

        completed = False
        notFound = False
        while 1:
            line = h.readline()
            if not line: break

            ## 416 Requested Range Not Satisfiable: cioe` file completato
            if re.match(".*416 Requested Range.*", line):
                completed = True

            if re.match(".*416 Unknown.*", line): # a volte dà questo messaggio d'errore...
                completed = True

            ## 404 Not Found: bisogna impostare la colonna della tabella che lo indica
            if re.match(".*404 Not Found.*", line):
                notFound = True

            ## le quadre servono per togliere l'"a capo", che verrebbe duplicato dal print line
            print line[:-1]
        err = h.close()


        if (not completed) and (not err): ## not completed: file scaricato ora; not err: file completo
            ## ricomprimi TODO: mettere una flag, non tutti i podcast potrebbero essere da ricomprimere
            cmd = "lame -h -v --vbr-new -V 8 -s 24 -q 0 \"%s\".tmp.mp3 \"%s\"" % (filename, filename)
            print cmd
            h = os.popen(cmd)
            h.close()


            ## aggiorna l'ID3
            if not author: ## imposta autore se non c'e` nel podcast
                author = sSostAuthor
            x = pyid3lib.tag( filename )
            x.artist = author
            x.title = title
            ## per il commento l'unico modo e` questo
            d = { 'frameid' : 'COMM', 'text' : description }
            x.append( d )

            x.update()
            completed = True

        if notFound or completed: ## aggiorna lo stato del record: non si trova piu`, non scaricarlo
            query = "update %s set state = 1 where id = '%s'" % (table, id)
            print "aggiorna tabella"

            curUpdate.execute(query)


    getCon().commit()



def getCon():
    global con
    return con



def main():
        global con
    con = sqlite.connect("/PATH/feed-store.3", encoding="utf-8")
    cur = con.cursor()


    ## codice per creare le tabelle usate (basta commentare commit ed execute per non eseguirlo)
    ## id: PK, state: 0 se da scaricare, >0 se scaricando da` 404 (file non piu` presente)

    #   drop table temp;
    create = """


    create table temp
    (
    id              varchar(200) PRIMARY KEY,
    url             varchar(200),
    author      varchar(50),
    title       varchar(200),
    date        varchar(50),
    description text,
    state       integer NOT NULL DEFAULT 0
    );
    """

    #cur.execute(create)
    #con.commit()


    ## scarica i feed ed aggiorna il DB

    # per beccare gli ID andare a vedere quelli de "Lista delle puntate MP3" su http://www.radio.rai.it/radio3/podcast/podcast.cfm
#   feed("http://www.radio.rai.it/radio3/podcast/rssradio3.jsp?id=273", 'scienza', filter_field = 'title', filter_exp= 'radio3 ?scienza')
    feed("http://www.radio.rai.it/radio3/podcast/rssradio3.jsp?id=451", 'storiaingiallo')
    feed("http://www.radio.rai.it/radio3/podcast/rssradio3.jsp?id=272", 'adaltavoce', 'title', '.*manhattan.*')
#   feed("http://www.radio.rai.it/radio3/podcast/rssradio3.jsp", 'uominieprofeti', 'description', '.*apocrifi.*')

    feed("http://www.radio.rai.it/radio2/podcast/rssradio2.jsp?id=1030", 'alle8dellasera', 'title', '.*khan.*')




    ## scarica ora gli MP3
    retrieve('storiaingiallo', path = "/PATH/La_storia_in_giallo",
             sSostAuthor = "La storia in giallo")
    retrieve('adaltavoce', path = "/PATH/Tre_camere_a_Manhattan")
    retrieve('alle8dellasera', path = "/PATH/Alle_8_della_sera/Gengis_Khan",
             sSostAuthor = "Alle 8 della sera")

if __name__ == "__main__":
    main()
