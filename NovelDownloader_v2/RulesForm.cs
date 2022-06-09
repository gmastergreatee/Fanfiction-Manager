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
                new MenuItem("Add", AddRule),
                new MenuItem("Edit", EditRule),
                new MenuItem("Delete", DeleteRule),
            });
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
            var counter = 1;
            foreach (var itm in Globals.Rules)
            {
                listRules.Items.Add(new ListViewItem(new string[]
                {
                    itm.RuleName,
                    itm.URLRegex,
                })
                {
                    Name = itm.Id.ToString(),
                    Text = counter + ".",
                });
                counter++;
            }
            ResetColumnWidths();
        }

        private Models.SiteRule SelectedRule
        {
            get
            {
                var rules = listRules.SelectedItems;
                if (rules.Count < 0)
                {
                    var id = rules[0].Name;
                    return Globals.Rules.FirstOrDefault(i => i.Id.ToString() == id);
                }
                return null;
            }
        }

        private void AddRule(object sender, EventArgs e)
        {
            new AddEditRuleForm().ShowDialog();
        }

        private void EditRule(object sender, EventArgs e)
        {
            var curRule = SelectedRule;
            if (curRule != null)
                new AddEditRuleForm(curRule).ShowDialog();
        }

        private void DeleteRule(object sender, EventArgs e)
        {
            var curRule = SelectedRule;
            if (curRule != null)
            {
                if (MessageBox.Show("Do you really want to delete the rule \"" + curRule.RuleName + "\" ?", "Delete Rule", MessageBoxButtons.YesNo, MessageBoxIcon.Question) == DialogResult.Yes)
                {
                    listRules.Items.RemoveByKey(curRule.Id.ToString());
                    Globals.Rules.Remove(curRule);
                    ResetColumnWidths();
                }
            }
        }
    }
}
