using System;
using System.Data;
using System.Linq;
using System.Text;
using System.Drawing;
using System.Windows.Forms;
using System.ComponentModel;
using System.Threading.Tasks;
using NovelDownloader_v2.Models;
using System.Collections.Generic;

namespace NovelDownloader_v2
{
    public partial class RulesForm : FormWrapper
    {
        public RulesForm()
        {
            InitializeComponent();
            Icon = Properties.Resources.AppIcon;

            listRules.Columns.AddRange(new ColumnHeader[]
            {
                new ColumnHeader()
                {
                    Name = "SN",
                    Text = "SN",
                    TextAlign = HorizontalAlignment.Right,
                },
                new ColumnHeader()
                {
                    Name = "RuleName",
                    Text = "Rule Name",
                    TextAlign = HorizontalAlignment.Left,
                },
                new ColumnHeader()
                {
                    Name = "URL",
                    Text = "URL Regex",
                    TextAlign = HorizontalAlignment.Left,
                },
            });

            listRules.ContextMenu = new ContextMenu(new MenuItem[]
            {
                new MenuItem("Add Rule", AddRule),
                new MenuItem("Edit Rule", EditRule),
                new MenuItem("Delete Rule", DeleteRule),
            });

            Globals.OnAddRule += OnAddUpdateRule;
            Globals.OnUpdateRule += OnAddUpdateRule;
        }

        private void OnAddUpdateRule(object sender, SiteRule e)
        {
            Invoke(new Action(() =>
            {
                RefreshRules();
            }));
        }

        private void RulesForm_Load(object sender, EventArgs e)
        {
            RefreshRules();
        }

        private void ResetColumnWidths()
        {
            listRules.Columns["SN"].Width = -2;
            listRules.Columns["RuleName"].Width = -2;
            listRules.Columns["URL"].Width = -2;
        }

        private void RefreshRules()
        {
            listRules.Items.Clear();

            var counter = 1;
            foreach (var itm in Globals.Rules)
            {
                var item = new ListViewItem(new string[]
                {
                    "",
                    itm.RuleName,
                    itm.URLRegex,
                })
                {
                    Name = itm.Id.ToString(),
                    Text = counter + ".",
                };
                listRules.Items.Add(item);
                counter++;
            }
            ResetColumnWidths();
        }

        private SiteRule SelectedRule
        {
            get
            {
                var rules = listRules.SelectedItems;
                if (rules.Count > 0)
                {
                    var id = rules[0].Name;
                    return Globals.Rules.FirstOrDefault(i => i.Id.ToString() == id);
                }
                return null;
            }
        }

        private void AddRule(object sender, EventArgs e)
        {
            ShowAddEditRule();
        }

        private void EditRule(object sender, EventArgs e)
        {
            var curRule = SelectedRule;
            if (curRule != null)
                ShowAddEditRule(curRule);
        }

        private void DeleteRule(object sender, EventArgs e)
        {
            var curRule = SelectedRule;
            if (curRule != null)
            {
                if (MessageBox.Show("Do you really want to delete the rule \"" + curRule.RuleName + "\" ?", "Delete Rule", MessageBoxButtons.YesNo, MessageBoxIcon.Question) == DialogResult.Yes)
                {
                    listRules.Items.RemoveByKey(curRule.Id.ToString());
                    Globals.OnDeleteRule?.Invoke(sender, curRule);
                    RefreshRules();
                }
            }
        }

        private void ShowAddEditRule(SiteRule siteRule = null)
        {
            if (Globals.TestRule != null)
            {
                MessageBox.Show("Please add/edit rules one by one only :(", "Info", MessageBoxButtons.OK, MessageBoxIcon.Information);
                return;
            }
            new AddEditRuleForm(siteRule).Show();
        }
    }
}
