using NovelDownloader_v2.Models;
using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.Data;
using System.Drawing;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.Windows.Forms;

namespace NovelDownloader_v2
{
    public partial class AddEditRuleForm : Form
    {
        private AddEditRuleUserControl addEditRuleUserControl { get; set; };
        private bool IsEditRuleForm { get; set; } = false;

        public AddEditRuleForm(SiteRule rule = null)
        {
            Globals.TestRule = new SiteRule();

            InitializeComponent();
            Size = new Size(880, 625);
            Icon = Properties.Resources.AppIcon;

            if (rule == null)
            {
                Text = "Add Rule";
            }
            else
            {
                IsEditRuleForm = true;
                Text = "Edit Rule";

                txtURLsToBlock.Text = string.Join(Environment.NewLine, rule.BlockedURLs);
                numRDTC.Value = rule.RapidDownloadTillChapter;
                numRDBuffer.Value = (decimal)rule.RapidDownloadBufferSeconds;
            }

            addEditRuleUserControl = new AddEditRuleUserControl(rule)
            {
                Dock = DockStyle.Top
            };

            tabPage1.Controls.Add(addEditRuleUserControl);

            FormClosing += AddEditRuleForm_FormClosing;
        }

        private void AddEditRuleForm_FormClosing(object sender, FormClosingEventArgs e)
        {
            Globals.TestRule = null;
        }

        private void BtnHelp_Click(object sender, EventArgs e)
        {
            new HelpForm(new HelpUserControls.AddEditRuleHelpUserControl()).Show();
        }

        private void BtnTest_Click(object sender, EventArgs e)
        {
            var blockUrls = txtURLsToBlock.Text.Trim();
            var blockUrlList = new List<string>();
            if (!string.IsNullOrWhiteSpace(blockUrls))
            {
                if (blockUrls.Contains("\n"))
                {
                    blockUrlList = blockUrls.Replace("\r", "").Split('\n').ToList();
                }
                else
                {
                    blockUrlList.Add(blockUrls.Replace("\r", ""));
                }
            }

            Globals.OnUpdateTestRule?.Invoke(sender, new SiteRule()
            {
                RuleName = addEditRuleUserControl.RuleName,
                URLRegex = addEditRuleUserControl.URLRegex,
                GetPageType_Javascript = addEditRuleUserControl.PageTypeScript,
                GetTOC_Javascript = addEditRuleUserControl.TOCScript,
                IsTOCPageAChapter = addEditRuleUserControl.IsTOCPageChapter,
                IsSinglePageNovel = addEditRuleUserControl.IsSinglePageNovel,
                GetSinglePageURL_Javascript = addEditRuleUserControl.SinglePageURLScript,
                GetChapter_Javascript = addEditRuleUserControl.ChapterScript,
                BlockedURLMatchingType = BlockedURLMatchingTypeEnum.Contains,
                BlockedURLs = blockUrlList,
                RapidDownloadTillChapter = (int)numRDTC.Value,
                RapidDownloadBufferSeconds = (double)numRDBuffer.Value,
            });
            Globals.OnOpenTestRenderer?.Invoke(sender, e);
        }

        private void btnSaveRule_Click(object sender, EventArgs e)
        {
            var blockUrls = txtURLsToBlock.Text.Trim();
            var blockUrlList = new List<string>();
            if (!string.IsNullOrWhiteSpace(blockUrls))
            {
                if (blockUrls.Contains("\n"))
                {
                    blockUrlList = blockUrls.Replace("\r", "").Split('\n').ToList();
                }
                else
                {
                    blockUrlList.Add(blockUrls.Replace("\r", ""));
                }
            }

            Globals.OnUpdateRule?.Invoke(sender, new SiteRule()
            {
                RuleName = addEditRuleUserControl.RuleName,
                URLRegex = addEditRuleUserControl.URLRegex,
                GetPageType_Javascript = addEditRuleUserControl.PageTypeScript,
                GetTOC_Javascript = addEditRuleUserControl.TOCScript,
                IsTOCPageAChapter = addEditRuleUserControl.IsTOCPageChapter,
                IsSinglePageNovel = addEditRuleUserControl.IsSinglePageNovel,
                GetSinglePageURL_Javascript = addEditRuleUserControl.SinglePageURLScript,
                GetChapter_Javascript = addEditRuleUserControl.ChapterScript,
                BlockedURLMatchingType = BlockedURLMatchingTypeEnum.Contains,
                BlockedURLs = blockUrlList,
                RapidDownloadTillChapter = (int)numRDTC.Value,
                RapidDownloadBufferSeconds = (double)numRDBuffer.Value,
            });
            
            Close();
        }
    }
}
