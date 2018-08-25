/* vim: set expandtab sw=4 ts=4 sts=4: */
/**
 * JavaScript functions used on Database Search page
 *
 * @requires    jQuery
 * @requires    js/functions.js
 *
 * @package PhpMyAdmin
 */

/**
 * AJAX script for the Database Search page.
 *
 * Actions ajaxified here:
 * Retrieve result of SQL query
 */

import { PMA_Messages as messages } from './variables/export_variables';
import { PMA_ajaxShowMessage, PMA_sprintf, PMA_ajaxRemoveMessage } from './utils/show_ajax_messages';
import PMA_commonParams from './variables/common_params';
import { PMA_makegrid } from './utils/makegrid';

/**
 * Unbind all event handlers before tearing down a page
 */
export function teardownDbSearch () {
    $('a.browse_results').off('click');
    $('a.delete_results').off('click');
    $('#buttonGo').off('click');
    $('#togglesearchresultlink').off('click');
    $('#togglequerybox').off('click');
    $('#togglesearchformlink').off('click');
    $(document).off('submit', '#db_search_form.ajax');
}

export function onloadDbSearch () {
    /** Hide the table link in the initial search result */
    let icon = PMA_getImage('s_tbl', '', { 'id': 'table-image' }).toString();
    $('#table-info').prepend(icon).hide();

    /** Hide the browse and deleted results in the new search criteria */
    $('#buttonGo').click(function () {
        $('#table-info').hide();
        $('#browse-results').hide();
        $('#sqlqueryform').hide();
        $('#togglequerybox').hide();
    });
    /**
     * Prepare a div containing a link for toggle the search results
     */
    $('#togglesearchresultsdiv')
    /** don't show it until we have results on-screen */
        .hide();

    /**
     * Changing the displayed text according to
     * the hide/show criteria in search result forms
     */
    $('#togglesearchresultlink')
        .html(messages.strHideSearchResults)
        .on('click', function () {
            let $link = $(this);
            $('#searchresults').slideToggle();
            if ($link.text() === messages.strHideSearchResults) {
                $link.text(messages.strShowSearchResults);
            } else {
                $link.text(messages.strHideSearchResults);
            }
            /** avoid default click action */
            return false;
        });

    /**
     * Prepare a div containing a link for toggle the search form,
     * otherwise it's incorrectly displayed after a couple of clicks
     */
    $('#togglesearchformdiv')
        .hide(); // don't show it until we have results on-screen

    /**
     * Changing the displayed text according to
     * the hide/show criteria in search form
     */
    $('#togglequerybox')
        .hide()
        .on('click', function () {
            let $link = $(this);
            $('#sqlqueryform').slideToggle('medium');
            if ($link.text() === messages.strHideQueryBox) {
                $link.text(messages.strShowQueryBox);
            } else {
                $link.text(messages.strHideQueryBox);
            }
            /** avoid default click action */
            return false;
        });

    /** don't show it until we have results on-screen */

    /**
     * Changing the displayed text according to
     * the hide/show criteria in search criteria form
     */
    $('#togglesearchformlink')
        .html(messages.strShowSearchCriteria)
        .on('click', function () {
            let $link = $(this);
            $('#db_search_form').slideToggle();
            if ($link.text() === messages.strHideSearchCriteria) {
                $link.text(messages.strShowSearchCriteria);
            } else {
                $link.text(messages.strHideSearchCriteria);
            }
            /** avoid default click action */
            return false;
        });

    /*
     * Ajax Event handler for retrieving the results from a table
     */
    $(document).on('click', 'a.browse_results', function (e) {
        e.preventDefault();
        /**   Hides the results shown by the delete criteria */
        let $msg = PMA_ajaxShowMessage(messages.strBrowsing, false);
        $('#sqlqueryform').hide();
        $('#togglequerybox').hide();
        /**  Load the browse results to the page */
        $('#table-info').show();
        let table_name = $(this).data('table-name');
        $('#table-link').attr({ 'href' : $(this).attr('href') }).text(table_name);

        let url = `${$(this).attr('href')}
            #searchresults`;

        let browse_sql = $(this).data('browse-sql');
        let params = {
            'ajax_request': true,
            'is_js_confirmed': true,
            'sql_query' : browse_sql
        };
        $.post(url, params, function (data) {
            if (typeof data !== 'undefined' && data.success) {
                $('#browse-results').html(data.message);
                PMA_ajaxRemoveMessage($msg);
                $('.table_results').each(function () {
                    PMA_makegrid(this);
                });
                $('#browse-results').show();
                PMA_highlightSQL($('#browse-results'));
                $('html, body')
                    .animate({
                        scrollTop: $('#browse-results').offset().top
                    }, 1000);
            } else {
                PMA_ajaxShowMessage(data.error, false);
            }
        });
    });

    /*
     * Ajax Event handler for deleting the results from a table
     */
    $(document).on('click', 'a.delete_results', function (e) {
        e.preventDefault();
        /**  Hides the results shown by the browse criteria */
        $('#table-info').hide();
        $('#sqlqueryform').hide();
        $('#togglequerybox').hide();
        /** Conformation message for deletion */
        let msg = PMA_sprintf(
            messages.strConfirmDeleteResults,
            $(this).data('table-name')
        );
        if (confirm(msg)) {
            let $msg = PMA_ajaxShowMessage(messages.strDeleting, false);
            /** Load the deleted option to the page*/
            $('#sqlqueryform').html('');
            let params = {
                'ajax_request': true,
                'is_js_confirmed': true,
                'sql_query': $(this).data('delete-sql')
            };
            let url = $(this).attr('href');

            $.post(url, params, function (data) {
                if (typeof data === 'undefined' || !data.success) {
                    PMA_ajaxShowMessage(data.error, false);
                    return;
                }

                $('#sqlqueryform').html(data.sql_query);
                /** Refresh the search results after the deletion */
                document.getElementById('buttonGo').click();
                $('#togglequerybox').html(messages.strHideQueryBox);
                /** Show the results of the deletion option */
                $('#browse-results').hide();
                $('#sqlqueryform').show();
                $('#togglequerybox').show();
                $('html, body')
                    .animate({
                        scrollTop: $('#browse-results').offset().top
                    }, 1000);
                PMA_ajaxRemoveMessage($msg);
            });
        }
    });

    /**
     * Ajax Event handler for retrieving the result of an SQL Query
     */
    $(document).on('submit', '#db_search_form.ajax', function (event) {
        event.preventDefault();
        var $msgbox = PMA_ajaxShowMessage(messages.strSearching, false);
        // jQuery object to reuse
        var $form = $(this);

        PMA_prepareForAjaxRequest($form);

        var url = `${$form.serialize()}
            ${PMA_commonParams.get('arg_separator')}submit_search=${$('#buttonGo').val()}`;
        $.post($form.attr('action'), url, function (data) {
            if (typeof data !== 'undefined' && data.success === true) {
                // found results
                $('#searchresults').html(data.message);

                $('#togglesearchresultlink')
                // always start with the Show message
                    .text(messages.strHideSearchResults);
                $('#togglesearchresultsdiv')
                // now it's time to show the div containing the link
                    .show();
                $('#searchresults').show();


                $('#db_search_form')
                    // workaround for Chrome problem (bug #3168569)
                    .slideToggle()
                    .hide();
                $('#togglesearchformlink')
                    // always start with the Show message
                    .text(messages.strShowSearchCriteria);
                $('#togglesearchformdiv')
                    // now it's time to show the div containing the link
                    .show();
            } else {
                // error message (zero rows)
                $('#searchresults').html(data.error).show();
            }

            PMA_ajaxRemoveMessage($msgbox);
        });
    });
}
