<?php
/* vim: set expandtab sw=4 ts=4 sts=4: */
/**
 * Selenium TestCase for table related tests
 *
 * @package    PhpMyAdmin-test
 * @subpackage Selenium
 */

require_once 'TestBase.php';


/**
 * PmaSeleniumDbOperationsTest class
 *
 * @package    PhpMyAdmin-test
 * @subpackage Selenium
 * @group      selenium
 */
class PMA_SeleniumDbOperationsTest extends PMA_SeleniumBase
{
    /**
     * setUp function that can use the selenium session (called before each test)
     *
     * @return void
     */
    public function setUpPage()
    {
        $this->login();
        $this->waitForElement('byLinkText', $this->database_name)->click();

        $this->waitForElementNotPresent('byId', 'ajax_message_num_1');
        $this->waitForElement("byPartialLinkText", "Structure");
        $this->expandMore();
        $this->waitForElement("byPartialLinkText", "Operations")->click();
        $this->waitForElement(
            "byXPath", "//legend[contains(., 'Rename database to')]"
        );
    }

    /**
     * Test for adding database comment
     *
     * @return void
     *
     * @group large
     */
    public function testDbComment()
    {
        $this->skipIfNotPMADB();
        $this->setUpPage();

        $this->byName("comment")->value("comment_foobar");
        $this->byCssSelector(
            "form#formDatabaseComment input[type='submit']"
        )->click();

        $this->assertNotNull(
            $this->waitForElement(
                "byXPath",
                "//span[@id='span_table_comment' and contains(., 'comment_foobar')]"
            )
        );
    }

    /**
     * Test for renaming database
     *
     * @return void
     *
     * @group large
     */
    public function testRenameDB()
    {
        $new_db_name = $this->database_name . 'rename';

        $this->scrollIntoView('copy_db_form');
        $newNameField = $this->waitForElement('byCssSelector', "form#rename_db_form input[name=newname]");

        $newNameField->clear();
        $newNameField->value($new_db_name);

        $this->byCssSelector("form#rename_db_form input[type='submit']")->click();

        $this->waitForElement("byCssSelector", "button.submitOK")->click();

        $this->waitForElement(
            "byXPath",
            "//a[@class='item' and contains(., 'Database: $new_db_name')]"
        );

        $result = $this->dbQuery(
            "SHOW DATABASES LIKE '$new_db_name';"
        );
        $this->assertEquals(1, $result->num_rows);

        $result = $this->dbQuery(
            "SHOW DATABASES LIKE '" . $this->database_name . "';"
        );
        $this->assertEquals(0, $result->num_rows);

        $this->database_name = $new_db_name;
    }

    /**
     * Test for copying database
     *
     * @return void
     *
     * @group large
     */
    public function testCopyDb()
    {
        $new_db_name = $this->database_name . 'copy';

        $this->scrollIntoView('copy_db_form');
        $newNameField = $this->waitForElement('byCssSelector', "form#copy_db_form input[name=newname]");

        $newNameField->clear();
        $newNameField->value($new_db_name);

        $this->byCssSelector("form#copy_db_form input[type='submit']")->click();

        $success = $this->waitForElement("byCssSelector", "div.success");
        $this->assertContains(
            'Database ' . $this->database_name . ' has been copied to ' . $new_db_name,
            $success->text()
        );

        $result = $this->dbQuery(
            "SHOW DATABASES LIKE '$new_db_name';"
        );
        $this->assertEquals(1, $result->num_rows);

        $this->dbQuery("DROP DATABASE $new_db_name");
    }
}
